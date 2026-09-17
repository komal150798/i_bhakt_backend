import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoChallengeDomain } from '../../challenges/entities/zuno-challenge-domain.entity';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ContextItemType,
  ThemeDirection,
  ZunoDomain,
} from '../../common/enums';
import { ScenarioAstroContext } from '../entities/scenario.types';

/**
 * Everything both engines need to know about the challenge they are working on.
 *
 * Extracted into its own service because ScenarioService and WhatIfService need
 * exactly the same three things - an owned challenge, its latest understanding,
 * and whatever approved astrology applies - and duplicating the fail-closed
 * rulebook handling in two places is how one of the two copies eventually
 * stops failing closed.
 */
export interface ChallengeProjection {
  challenge: ZunoChallenge;
  context: ZunoChallengeContext | null;
  domains: ZunoDomain[];
  summary: string;
  /** Step 11 section 8: only what the user stated or confirmed. */
  facts: string[];
  /** Fears, assumptions and beliefs. Never presented as established. */
  concerns: string[];
  dependencies: { from: string; to: string; description?: string | null }[];
  decisions: { question: string; options: string[] }[];
  controllable: string[];
  external: string[];
  temporalAnchors: { raw: string; normalized_date: string | null }[];
  /** Concatenated user-facing source text, for the safety pre-check. */
  safetyText: string;
}

@Injectable()
export class ScenarioContextService {
  private readonly logger = new Logger(ScenarioContextService.name);

  constructor(
    @InjectRepository(ZunoChallenge)
    private readonly challenges: Repository<ZunoChallenge>,
    @InjectRepository(ZunoChallengeContext)
    private readonly contexts: Repository<ZunoChallengeContext>,
    @InjectRepository(ZunoChallengeDomain)
    private readonly challengeDomains: Repository<ZunoChallengeDomain>,
    private readonly ownership: ZunoOwnershipService,
    private readonly rulebook: RulebookRepositoryService,
  ) {}

  /**
   * Loads a challenge the caller owns, or throws NOT_FOUND.
   *
   * Step 21 section 106 and Golden Contract Test 125: user A asking for user
   * B's challenge must not be able to tell the difference between "not yours"
   * and "does not exist". ZunoOwnershipService masks both as NOT_FOUND, and
   * every entry point into this module goes through here.
   */
  async requireOwnedChallenge(
    userId: string,
    challengeId: string,
  ): Promise<ZunoChallenge> {
    const challenge = await this.challenges.findOne({
      where: { id: challengeId, deleted_at: IsNull() },
    });
    return this.ownership.require(challenge, userId, 'challenge');
  }

  /**
   * Projects the current understanding into the shape the engines consume.
   *
   * Step 12 section 7 says only relevant inputs should be passed, and Build
   * Rule 93 forbids shipping the user's whole history to every model call, so
   * this is a projection rather than the context object itself.
   */
  async project(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeProjection> {
    const challenge = await this.requireOwnedChallenge(userId, challengeId);

    const context = await this.contexts.findOne({
      where: { challenge_id: challenge.id },
      order: { version_number: 'DESC' },
    });

    // Step 12 section 55 starts the pipeline at CHALLENGE CONTEXT. Without one,
    // there is nothing to branch from, and generating scenarios from the raw
    // statement would be the engine inventing its own understanding. Step 21
    // section 109 says to report the real processing state instead.
    if (!context) {
      throw new ZunoException(ZunoErrorCode.PROCESSING, {
        message:
          'We need to understand this one before we can map out the possibilities.',
        internalDetail: `challenge ${challenge.id} has no context version`,
      });
    }

    const domainRows = await this.challengeDomains.find({
      where: { challenge_id: challenge.id },
    });
    const domains = domainRows.length > 0
      ? domainRows.map((row) => row.domain)
      : challenge.primary_domain
        ? [challenge.primary_domain]
        : [];

    const items = context.payload?.items ?? [];
    const facts = items
      .filter(
        (item) =>
          item.type === ContextItemType.FACT ||
          item.type === ContextItemType.EXTERNAL_EVENT,
      )
      .map((item) => item.text);
    const concerns = items
      .filter(
        (item) =>
          item.type === ContextItemType.FEAR ||
          item.type === ContextItemType.ASSUMPTION ||
          item.type === ContextItemType.USER_BELIEF,
      )
      .map((item) => item.text);

    return {
      challenge,
      context,
      domains,
      summary: context.summary ?? '',
      facts,
      concerns,
      dependencies: (context.payload?.dependencies ?? []).map((edge) => ({
        from: edge.from,
        to: edge.to,
        description: edge.description ?? null,
      })),
      decisions: (context.payload?.decisions ?? []).map((decision) => ({
        question: decision.question,
        options: decision.options,
      })),
      controllable: context.payload?.factors?.controllable ?? [],
      external: context.payload?.factors?.external ?? [],
      temporalAnchors: (context.payload?.temporal_anchors ?? []).map((anchor) => ({
        raw: anchor.raw,
        normalized_date: anchor.normalized_date,
      })),
      // The user's own words plus the understanding drawn from them. This is
      // what the safety pre-check reads, so it must include the raw statement:
      // a critical signal lives in what the person actually typed.
      safetyText: [challenge.raw_user_statement, context.summary, ...concerns]
        .filter(Boolean)
        .join('\n'),
    };
  }

  /**
   * Approved astrology themes for these domains, or null.
   *
   * FAIL CLOSED, GRACEFULLY. Step 20 section 125 is the governing rule:
   * "if the active Rulebook cannot be safely loaded, FAIL CLOSED FOR ASTROLOGY
   * RULE GENERATION. Continue safe non-astrology functionality where possible.
   * Never ask the LLM to invent missing rules."
   *
   * There is no active Rulebook in this repository today -
   * `RulebookRepositoryService.requireActive()` throws RULEBOOK_UNAVAILABLE -
   * so this returns null on every call in the current deployment. That is the
   * correct behaviour and not a stub: the scenario set is then produced from
   * the user's situation alone, with `provenance.astro_available = false`
   * recording honestly that it carries no astrology.
   *
   * What it must never do is throw. Step 21 section 117 and Step 19 section 117
   * both say a high-risk or unavailable part must not make the rest useless,
   * and Step 12 section 3 puts astrology among the engine's inputs, not among
   * its requirements. A missing rulebook costs the set its themes, not its
   * existence.
   *
   * It also must never fall back to asking a model for themes. Step 12
   * section 100 names that as the anti-pattern by name.
   */
  async loadAstroContext(
    domains: ZunoDomain[],
  ): Promise<ScenarioAstroContext | null> {
    if (domains.length === 0) return null;

    try {
      const active = await this.rulebook.getActive();
      if (!active) {
        this.logger.debug(
          'No active Rulebook - generating scenarios without astrology (Step 20 s.125)',
        );
        return null;
      }

      const rules = await this.rulebook.findRules({ domains });
      if (rules.length === 0) {
        // Step 21 section 35: insufficient rule coverage is reported as
        // insufficient, never filled in by the model.
        this.logger.debug(
          `Rulebook ${active.version} matched no approved rule for ${domains.join(',')}`,
        );
        return null;
      }

      const supportive: string[] = [];
      const caution: string[] = [];
      for (const rule of rules) {
        if (rule.direction === ThemeDirection.SUPPORTIVE) {
          supportive.push(rule.theme);
        } else if (rule.direction === ThemeDirection.CAUTION) {
          caution.push(rule.theme);
        } else if (rule.direction === ThemeDirection.MIXED) {
          // A MIXED direction is genuinely both. Dropping it would lose a
          // signal; forcing it into one bucket would overstate it.
          supportive.push(rule.theme);
          caution.push(rule.theme);
        }
        // NEUTRAL themes deliberately contribute nothing: Step 12 section 47
        // allows astrology to shape which themes deserve attention, and a
        // neutral theme by definition does not shift attention either way.
      }

      return {
        supportive_themes: unique(supportive),
        caution_themes: unique(caution),
        // Timing windows come from timing rules, which are resolved by the
        // astrology interpretation layer rather than here. Left empty rather
        // than approximated - Step 12 section 48 treats these as approved
        // inputs, and an approximation would not be one.
        timing_windows: [],
        rule_keys: rules.map((rule) => rule.external_rule_key),
        rulebook_version_id: active.versionId,
      };
    } catch (error) {
      // requireActive() inside findRules() throws RULEBOOK_UNAVAILABLE when no
      // version is in production. Swallowed on purpose: this whole method is
      // the graceful half of failing closed.
      this.logger.warn(
        `Rulebook unavailable; scenarios will be produced without astrology (${
          error instanceof Error ? error.message : 'unknown'
        })`,
      );
      return null;
    }
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
