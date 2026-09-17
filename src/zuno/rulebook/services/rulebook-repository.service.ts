import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import {
  ZunoRulebookInterpretation,
  ZunoRulebookRemedy,
  ZunoRulebookDomainConfig,
  ZunoRulebookConflictRule,
} from '../entities/zuno-rulebook-knowledge.entity';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { ClockService } from '../../common/services/clock.service';
import {
  RuleStatus,
  RulebookStatus,
  SmeConfidence,
  NON_PRODUCTION_SAFETY_CLASSES,
  ZunoDomain,
} from '../../common/enums';

export interface ActiveRulebook {
  versionId: string;
  version: string;
  activatedAt: Date | null;
  hash: string;
}

export interface RuleMatchQuery {
  domains: ZunoDomain[];
  /** Reference date, for effective_from / effective_until filtering. */
  referenceDate?: string;
}

/**
 * Runtime access to the active SME Rulebook.
 * Step 21 sections 80-81, Step 20 sections 123-125, Step 10 section 19.
 *
 * This is the only way engines reach rulebook content, and it exists to enforce
 * three rules that must never be bypassed:
 *
 * **1. The server resolves the version, never the client.**
 * Step 20 section 123 forbids hard-coding a version anywhere in application
 * logic, and Step 21 Rule 8 and Anti-Pattern 135 forbid a client choosing one.
 * There is deliberately no method here that accepts a version from a caller for
 * production use.
 *
 * **2. Fail closed.**
 * Step 20 section 125: if the active Rulebook cannot be safely loaded,
 * "FAIL CLOSED FOR ASTROLOGY RULE GENERATION. Continue safe non-astrology
 * functionality where possible. Never ask the LLM to invent missing rules."
 * `requireActive()` throws RULEBOOK_UNAVAILABLE rather than returning an empty
 * set, because an empty set silently looks like "no astrological factors apply"
 * - which is a fabrication.
 *
 * **3. Only production-eligible rules are ever returned.**
 * An APPROVED rulebook can still contain rules that must not run: experimental
 * ones (Step 08 section 69), and anything classed SME_SUPERVISION or
 * EXCLUDE_PENDING_SPECIAL_REVIEW (Step 10 section 17). Those are filtered here,
 * not left to each caller to remember.
 */
@Injectable()
export class RulebookRepositoryService {
  private readonly logger = new Logger(RulebookRepositoryService.name);

  /**
   * Cached pointer to the active version.
   *
   * Only the *identity* is cached, not rule content - Step 20 section 124
   * requires invalidation on activation, and caching a whole rulebook makes a
   * stale-content bug far more likely than a stale pointer. Rules are read
   * per-query and are cheap with the domain index.
   */
  private cachedActive: ActiveRulebook | null = null;
  private cacheLoadedAt = 0;
  private static readonly CACHE_TTL_MS = 60_000;

  constructor(
    @InjectRepository(ZunoRulebookVersion)
    private readonly versions: Repository<ZunoRulebookVersion>,
    @InjectRepository(ZunoRulebookRule)
    private readonly rules: Repository<ZunoRulebookRule>,
    @InjectRepository(ZunoRulebookInterpretation)
    private readonly interpretations: Repository<ZunoRulebookInterpretation>,
    @InjectRepository(ZunoRulebookRemedy)
    private readonly remedies: Repository<ZunoRulebookRemedy>,
    @InjectRepository(ZunoRulebookDomainConfig)
    private readonly domainConfigs: Repository<ZunoRulebookDomainConfig>,
    @InjectRepository(ZunoRulebookConflictRule)
    private readonly conflictRules: Repository<ZunoRulebookConflictRule>,
    private readonly clock: ClockService,
  ) {}

  /**
   * The active production rulebook, or null if there is none.
   * Step 21 section 80.
   */
  async getActive(): Promise<ActiveRulebook | null> {
    const now = Date.now();
    if (this.cachedActive && now - this.cacheLoadedAt < RulebookRepositoryService.CACHE_TTL_MS) {
      return this.cachedActive;
    }

    const version = await this.versions.findOne({
      where: { is_production: true, status: RulebookStatus.PRODUCTION },
    });

    this.cachedActive = version
      ? {
          versionId: version.id,
          version: version.version,
          activatedAt: version.activated_at,
          hash: version.source_file_hash,
        }
      : null;
    this.cacheLoadedAt = now;
    return this.cachedActive;
  }

  /**
   * The active rulebook, or a clean refusal.
   *
   * Callers that need astrology use this. The thrown error is deliberately a
   * typed RULEBOOK_UNAVAILABLE so the response layer can degrade gracefully -
   * Step 21 section 119 pairs it with copy like "your personalised guidance is
   * temporarily unavailable; your existing plan is still here", and Step 21
   * section 101 forbids falling back to unguided LLM astrology.
   */
  async requireActive(): Promise<ActiveRulebook> {
    const active = await this.getActive();
    if (!active) {
      this.logger.warn(
        'No active Rulebook. Astrology-derived guidance is disabled (fail closed).',
      );
      throw new ZunoException(ZunoErrorCode.RULEBOOK_UNAVAILABLE, {
        internalDetail: 'no rulebook version in PRODUCTION status',
      });
    }
    return active;
  }

  /** True when astrology-derived guidance is currently possible. */
  async isAstrologyAvailable(): Promise<boolean> {
    return (await this.getActive()) !== null;
  }

  /**
   * Production-eligible rules for the given domains.
   * Step 21 section 81 ("only approved active rules are eligible").
   */
  async findRules(query: RuleMatchQuery): Promise<ZunoRulebookRule[]> {
    const active = await this.requireActive();
    if (query.domains.length === 0) return [];

    const candidates = await this.rules.find({
      where: {
        rulebook_version_id: active.versionId,
        domain: In(query.domains),
        status: RuleStatus.APPROVED,
      },
    });

    const referenceDate = query.referenceDate ?? this.clock.today();

    return candidates.filter((rule) => {
      // Belt and braces: the query already filters on APPROVED, but these two
      // exclusions are the ones with real consequences if they leak.
      if (rule.sme_confidence === SmeConfidence.EXPERIMENTAL) return false;
      if (NON_PRODUCTION_SAFETY_CLASSES.includes(rule.safety_class)) return false;

      // Step 08 sections 64-65: effective dates and deprecation.
      if (rule.effective_from && referenceDate < rule.effective_from) return false;
      if (rule.effective_until && referenceDate > rule.effective_until) return false;
      return true;
    });
  }

  /**
   * Interpretations by key, scoped to the active rulebook.
   *
   * Returns a Map so a caller cannot accidentally treat a missing
   * interpretation as an empty string and emit a rule with no meaning.
   */
  async findInterpretations(
    keys: string[],
  ): Promise<Map<string, ZunoRulebookInterpretation>> {
    if (keys.length === 0) return new Map();
    const active = await this.requireActive();
    const rows = await this.interpretations.find({
      where: {
        rulebook_version_id: active.versionId,
        external_interpretation_key: In(keys),
        status: RuleStatus.APPROVED,
      },
    });
    return new Map(rows.map((r) => [r.external_interpretation_key, r]));
  }

  /**
   * Approved remedies by key.
   *
   * Build Rule 51 and Step 08 section 39: if a remedy is not here, ZUNO has
   * nothing to suggest and must say so rather than improvising one.
   */
  async findRemedies(keys: string[]): Promise<ZunoRulebookRemedy[]> {
    if (keys.length === 0) return [];
    const active = await this.requireActive();
    const rows = await this.remedies.find({
      where: {
        rulebook_version_id: active.versionId,
        external_remedy_key: In(keys),
        status: RuleStatus.APPROVED,
      },
    });
    return rows.filter(
      (r) => !NON_PRODUCTION_SAFETY_CLASSES.includes(r.safety_class),
    );
  }

  /**
   * Per-domain methodology, used to scope which chart factors are relevant.
   * Step 07 section 34: do not produce the whole horoscope for every concern.
   */
  async findDomainConfigs(
    domains: ZunoDomain[],
  ): Promise<Map<ZunoDomain, ZunoRulebookDomainConfig>> {
    if (domains.length === 0) return new Map();
    const active = await this.requireActive();
    const rows = await this.domainConfigs.find({
      where: { rulebook_version_id: active.versionId, domain: In(domains) },
    });
    return new Map(rows.map((r) => [r.domain, r]));
  }

  /**
   * SME-defined conflict resolution for a set of matched rules.
   * Step 10 section 16.
   *
   * Where no conflict rule covers a disagreement, this returns nothing and the
   * caller must fall back safely and raise an SME review candidate
   * (Build Rule 59). It never picks a winner on its own.
   */
  async findConflictRules(ruleKeys: string[]): Promise<ZunoRulebookConflictRule[]> {
    if (ruleKeys.length === 0) return [];
    const active = await this.requireActive();
    const all = await this.conflictRules.find({
      where: { rulebook_version_id: active.versionId },
    });
    const wanted = new Set(ruleKeys);
    return all.filter((c) => (c.rule_keys ?? []).some((k) => wanted.has(k)));
  }

  /**
   * Reads a specific historical version.
   *
   * Step 20 section 70 and Step 10 section 29: an old response must remain
   * explainable against the rulebook that produced it, and a later rulebook
   * must never silently reinterpret it. This is for audit and explanation only
   * - it must not be used to generate new guidance, which is why it is named
   * for what it is.
   */
  async findRuleForAudit(
    versionId: string,
    externalRuleKey: string,
  ): Promise<ZunoRulebookRule | null> {
    return this.rules.findOne({
      where: {
        rulebook_version_id: versionId,
        external_rule_key: externalRuleKey,
      },
    });
  }

  /**
   * Drops the cached pointer. Step 20 section 124: activation must invalidate
   * the old runtime cache so no request is served from a retired version.
   *
   * Called by the governance service after activation and rollback. In a
   * multi-instance deployment this needs to become a broadcast invalidation;
   * noted in ZUNO_DECISION_LOG.md rather than pretended otherwise.
   */
  invalidateCache(): void {
    this.cachedActive = null;
    this.cacheLoadedAt = 0;
    this.logger.log('Rulebook runtime cache invalidated.');
  }
}
