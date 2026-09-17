import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import {
  ZunoRulebookAuditLog,
  ZunoRulebookReviewItem,
  ZunoRulebookValidationRun,
} from '../entities/zuno-rulebook-governance.entity';
import { RuleReviewStatus } from '../../common/enums';

export interface RuleListItem {
  ruleId: string;
  ruleKey: string;
  ruleName: string;
  domain: string;
  theme: string;
  direction: string;
  strength: string;
  safetyClass: string;
  status: string;
  smeConfidence: string;
  sensitiveSubjects: string[];
  primaryCondition: string;
  interpretationKey: string | null;
  reviewStatus: RuleReviewStatus | null;
  requiresTwoPersonReview: boolean;
  hasSecondaryReview: boolean;
  duplicateOfKey: string | null;
  sourceRow: number | null;
}

/**
 * Read models for the Rulebook admin console.
 * Step 10 sections 7 and 22-24, Step 21 section 75.
 *
 * Kept separate from RulebookGovernanceService so that lifecycle logic and
 * reporting do not tangle: this class only reads, and holds no authority over
 * what a rulebook may do next.
 */
@Injectable()
export class RulebookDashboardService {
  constructor(
    @InjectRepository(ZunoRulebookVersion)
    private readonly versions: Repository<ZunoRulebookVersion>,
    @InjectRepository(ZunoRulebookRule)
    private readonly rules: Repository<ZunoRulebookRule>,
    @InjectRepository(ZunoRulebookReviewItem)
    private readonly reviewItems: Repository<ZunoRulebookReviewItem>,
    @InjectRepository(ZunoRulebookValidationRun)
    private readonly validationRuns: Repository<ZunoRulebookValidationRun>,
    @InjectRepository(ZunoRulebookAuditLog)
    private readonly auditLog: Repository<ZunoRulebookAuditLog>,
  ) {}

  async listVersions(limit: number): Promise<ZunoRulebookVersion[]> {
    return this.versions.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async latestValidationRun(
    versionId: string,
  ): Promise<ZunoRulebookValidationRun | null> {
    return this.validationRuns.findOne({
      where: { rulebook_version_id: versionId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * SME review progress. Step 21 section 75.
   *
   * Reports counts by domain, safety class and review state so the SME can see
   * where the remaining work is rather than scrolling 1600 rows.
   */
  async reviewDashboard(versionId: string): Promise<Record<string, unknown>> {
    const [rules, items] = await Promise.all([
      this.rules.find({ where: { rulebook_version_id: versionId } }),
      this.reviewItems.find({ where: { rulebook_version_id: versionId } }),
    ]);

    const byReviewStatus = tally(items.map((i) => i.review_status));
    const byDomain = tally(rules.map((r) => r.domain));
    const bySafetyClass = tally(rules.map((r) => r.safety_class));
    const byTheme = tally(rules.map((r) => r.theme));
    const byStatus = tally(rules.map((r) => r.status));

    const pending = items.filter(
      (i) => i.review_status === RuleReviewStatus.PENDING,
    ).length;
    const approved = items.filter(
      (i) => i.review_status === RuleReviewStatus.APPROVED,
    ).length;
    const rejected = items.filter(
      (i) => i.review_status === RuleReviewStatus.REJECTED,
    ).length;
    const duplicates = items.filter(
      (i) => i.review_status === RuleReviewStatus.POSSIBLE_DUPLICATE,
    ).length;

    const twoPersonRequired = items.filter((i) => i.requires_two_person_review);
    const awaitingSecondReview = twoPersonRequired.filter(
      (i) => i.secondary_reviewer_id === null,
    ).length;

    return {
      totalRules: rules.length,
      reviewedRules: items.length - pending,
      pendingRules: pending,
      approvedRules: approved,
      rejectedRules: rejected,
      possibleDuplicates: duplicates,
      // Step 08 section 62: high-impact rules need two signatures, and
      // approval is blocked until they have them.
      twoPersonReviewRequired: twoPersonRequired.length,
      awaitingSecondReview,
      readyForApproval: pending === 0 && awaitingSecondReview === 0,
      byReviewStatus,
      byDomain,
      bySafetyClass,
      byTheme,
      byRuleStatus: byStatus,
    };
  }

  /** Step 21 section 76: rule list with review state, filterable. */
  async listRules(
    versionId: string,
    options: {
      reviewStatus?: string;
      domain?: string;
      limit: number;
      offset: number;
    },
  ): Promise<{ items: RuleListItem[]; total: number }> {
    const query = this.rules
      .createQueryBuilder('rule')
      .where('rule.rulebook_version_id = :versionId', { versionId })
      .orderBy('rule.external_rule_key', 'ASC')
      .skip(options.offset)
      .take(options.limit);

    if (options.domain) {
      query.andWhere('rule.domain = :domain', {
        domain: options.domain.toUpperCase(),
      });
    }

    const [rules, total] = await query.getManyAndCount();

    // One query for the review items of this page, rather than per rule.
    const items = rules.length
      ? await this.reviewItems.find({
          where: { rulebook_version_id: versionId },
        })
      : [];
    const byRuleId = new Map(items.map((i) => [i.rule_id, i]));

    let mapped: RuleListItem[] = rules.map((rule) => {
      const item = byRuleId.get(rule.id);
      return {
        ruleId: rule.id,
        ruleKey: rule.external_rule_key,
        ruleName: rule.rule_name,
        domain: rule.domain,
        theme: rule.theme,
        direction: rule.direction,
        strength: rule.strength,
        safetyClass: rule.safety_class,
        status: rule.status,
        smeConfidence: rule.sme_confidence,
        sensitiveSubjects: rule.sensitive_subjects ?? [],
        // The SME's own wording for the primary condition, so review does not
        // require reading inferred structure.
        primaryCondition:
          (rule.conditions ?? []).find((c) => c.role === 'PRIMARY')
            ?.raw_expression ?? '',
        interpretationKey: rule.interpretation_key,
        reviewStatus: item?.review_status ?? null,
        requiresTwoPersonReview: item?.requires_two_person_review ?? false,
        hasSecondaryReview: item?.secondary_reviewer_id != null,
        duplicateOfKey: item?.duplicate_of_key ?? null,
        sourceRow: rule.source_row,
      };
    });

    // Applied after mapping because review state lives on a different table;
    // the page size keeps this cheap.
    if (options.reviewStatus) {
      const wanted = options.reviewStatus.toUpperCase();
      mapped = mapped.filter((r) => r.reviewStatus === wanted);
    }

    return { items: mapped, total };
  }

  /** Step 10 sections 36-37: immutable audit trail, newest first. */
  async auditTrail(versionId: string): Promise<Record<string, unknown>[]> {
    const entries = await this.auditLog.find({
      where: { rulebook_version_id: versionId },
      order: { created_at: 'DESC' },
      take: 200,
    });
    return entries.map((entry) => ({
      action: entry.action,
      actorId: entry.actor_id,
      actorRole: entry.actor_role,
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      reason: entry.reason,
      metadata: entry.metadata,
      at: entry.created_at.toISOString(),
    }));
  }
}

function tally(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
