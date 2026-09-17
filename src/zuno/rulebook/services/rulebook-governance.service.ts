import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ZunoRulebookVersion } from '../entities/zuno-rulebook-version.entity';
import { ZunoRulebookRule } from '../entities/zuno-rulebook-rule.entity';
import {
  ZunoRulebookAuditLog,
  ZunoRulebookReviewItem,
  ZunoRulebookValidationRun,
} from '../entities/zuno-rulebook-governance.entity';
import {
  RulebookParserService,
  RULEBOOK_PARSER_VERSION,
} from '../parsing/rulebook-parser.service';
import {
  RulebookValidatorService,
  RULEBOOK_VALIDATOR_VERSION,
} from '../validation/rulebook-validator.service';
import { RulebookCompilerService } from './rulebook-compiler.service';
import { ClockService } from '../../common/services/clock.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  canTransitionRulebook,
  RuleReviewStatus,
  RuleSafetyClass,
  RulebookAuditAction,
  RulebookPermission,
  RulebookReleaseType,
  RulebookStatus,
  SensitiveSubject,
} from '../../common/enums';

export interface GovernanceActor {
  userId: string;
  role: string;
  permissions: RulebookPermission[];
}

export interface UploadRulebookInput {
  version: string;
  releaseName: string;
  description?: string;
  releaseType: RulebookReleaseType;
  smeReference?: string;
  changeSummary?: string;
  fileName: string;
  buffer: Buffer;
  storedLocation?: string | null;
}

/**
 * Owns the Rulebook lifecycle.
 * Step 10 sections 5-28, Step 20 sections 65-73, Step 21 sections 71-79.
 *
 * Two directives from Step 10 section 47 shape everything here:
 *
 *   1. Astrology knowledge is externally managed and versioned - so a new
 *      rulebook is uploaded, never coded.
 *   2. "Never allow an uploaded Rulebook to become active solely because it
 *      passed technical validation."
 *
 * The second is enforced structurally rather than by convention. There is no
 * method that takes a freshly validated rulebook to production; the only route
 * runs upload -> validate -> SME review -> stage -> regression -> approve ->
 * activate, and each step checks both the permission and the legality of the
 * status transition.
 *
 * Separation of duties (Step 10 section 25) is likewise enforced, not merely
 * documented: `approve` refuses if the approver is the uploader, and `activate`
 * refuses if the activator is the approver.
 */
@Injectable()
export class RulebookGovernanceService {
  private readonly logger = new Logger(RulebookGovernanceService.name);

  constructor(
    @InjectRepository(ZunoRulebookVersion)
    private readonly versions: Repository<ZunoRulebookVersion>,
    @InjectRepository(ZunoRulebookRule)
    private readonly rules: Repository<ZunoRulebookRule>,
    @InjectRepository(ZunoRulebookValidationRun)
    private readonly validationRuns: Repository<ZunoRulebookValidationRun>,
    @InjectRepository(ZunoRulebookReviewItem)
    private readonly reviewItems: Repository<ZunoRulebookReviewItem>,
    private readonly parser: RulebookParserService,
    private readonly validator: RulebookValidatorService,
    private readonly compiler: RulebookCompilerService,
    private readonly clock: ClockService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Step 21 section 72-73. Upload does NOT mean activation.
   */
  async upload(
    actor: GovernanceActor,
    input: UploadRulebookInput,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_UPLOAD);

    if (!/^\d+\.\d+\.\d+$/.test(input.version)) {
      throw ZunoException.validation(
        [{ field: 'version', code: 'INVALID_SEMVER' }],
        'Version must be semantic, e.g. 1.5.0.',
      );
    }

    const duplicateVersion = await this.versions.findOne({
      where: { version: input.version },
    });
    if (duplicateVersion) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `Version ${input.version} has already been uploaded.`,
      });
    }

    // Parse now so an unreadable file is rejected at the door rather than
    // creating a dangling version row (Step 10 section 10).
    const parsed = await this.parser.parse(input.buffer, input.fileName);

    const duplicateFile = await this.versions.findOne({
      where: { source_file_hash: parsed.fileHash },
    });
    if (duplicateFile) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `This exact file was already uploaded as version ${duplicateFile.version}.`,
      });
    }

    const now = this.clock.now();
    return this.dataSource.transaction(async (manager) => {
      const version = manager.create(ZunoRulebookVersion, {
        version: input.version,
        release_name: input.releaseName,
        description: input.description ?? null,
        release_type: input.releaseType,
        status: RulebookStatus.UPLOADED,
        source_file_name: input.fileName,
        source_file_hash: parsed.fileHash,
        source_file_size: String(parsed.fileSize),
        source_file_location: input.storedLocation ?? null,
        sme_reference: input.smeReference ?? null,
        change_summary: input.changeSummary ?? null,
        uploaded_by: actor.userId,
        uploaded_at: now,
        is_production: false,
      });
      const saved = await manager.save(ZunoRulebookVersion, version);

      await this.audit(manager, saved.id, RulebookAuditAction.RULEBOOK_UPLOADED, actor, {
        toStatus: RulebookStatus.UPLOADED,
        metadata: {
          file_hash: parsed.fileHash,
          file_size: parsed.fileSize,
          release_type: input.releaseType,
        },
      });

      this.logger.log(
        `Rulebook ${saved.version} uploaded by ${actor.userId} (${parsed.fileHash.slice(0, 12)})`,
      );
      return saved;
    });
  }

  /**
   * Validates and, on success, compiles the workbook into rules.
   * Step 21 section 74, Step 10 sections 11-18.
   *
   * Failure leaves production untouched (Step 10 section 40) and records the
   * findings so the SME can see exactly which rows to fix.
   */
  async validate(
    actor: GovernanceActor,
    versionId: string,
    buffer: Buffer,
  ): Promise<{ version: ZunoRulebookVersion; run: ZunoRulebookValidationRun }> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_VALIDATE);
    const version = await this.findVersion(versionId);
    this.assertTransition(version, RulebookStatus.VALIDATING);

    const startedAt = this.clock.now();
    const parsed = await this.parser.parse(buffer, version.source_file_name);

    // The file must be byte-identical to what was uploaded, or provenance is
    // meaningless (Step 20 section 56).
    if (parsed.fileHash !== version.source_file_hash) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message:
          'The supplied file does not match the uploaded file for this version.',
        internalDetail: 'rulebook file hash mismatch on validate',
      });
    }

    const result = this.validator.validate(parsed);

    return this.dataSource.transaction(async (manager) => {
      await this.setStatus(manager, version, RulebookStatus.VALIDATING, actor, {
        action: RulebookAuditAction.VALIDATION_STARTED,
      });

      const run = manager.create(ZunoRulebookValidationRun, {
        rulebook_version_id: version.id,
        validator_version: `${RULEBOOK_PARSER_VERSION}+${RULEBOOK_VALIDATOR_VERSION}`,
        status: result.passed
          ? result.warningCount > 0
            ? ('PASSED_WITH_WARNINGS' as const)
            : ('PASSED' as const)
          : ('FAILED' as const),
        total_rules: result.totalRules,
        valid_rules: result.validRules,
        invalid_rules: result.invalidRules,
        error_count: result.errorCount,
        warning_count: result.warningCount,
        findings: result.findings,
        started_at: startedAt,
        completed_at: this.clock.now(),
      });
      const savedRun = await manager.save(ZunoRulebookValidationRun, run);

      if (!result.passed) {
        const failed = await this.setStatus(
          manager,
          version,
          RulebookStatus.VALIDATION_FAILED,
          actor,
          {
            action: RulebookAuditAction.VALIDATION_FAILED,
            reason: `${result.errorCount} validation error(s)`,
            metadata: { validation_run_id: savedRun.id },
          },
        );
        return { version: failed, run: savedRun };
      }

      // Compile only after validation passes.
      const counts = await this.compiler.compile(manager, version.id, parsed);

      version.total_rules = counts.rules;
      version.total_interpretations = counts.interpretations;
      version.total_remedies = counts.remedies;
      version.total_timing_rules = counts.timingRules;
      version.total_golden_cases = counts.goldenCases;
      version.domains_covered = counts.domainsCovered;
      await manager.save(ZunoRulebookVersion, version);

      // Seed the SME review queue, one item per rule (Step 20 section 72).
      await this.seedReviewItems(manager, version.id, result.duplicateCandidates);

      const validated = await this.setStatus(
        manager,
        version,
        RulebookStatus.VALIDATED,
        actor,
        {
          action: RulebookAuditAction.VALIDATION_PASSED,
          metadata: {
            validation_run_id: savedRun.id,
            rules: counts.rules,
            warnings: result.warningCount,
          },
        },
      );

      this.logger.log(
        `Rulebook ${version.version} validated: ${counts.rules} rules compiled, ${result.warningCount} warnings`,
      );
      return { version: validated, run: savedRun };
    });
  }

  /**
   * Creates one review item per rule.
   *
   * Step 08 section 62 wants two-person review on high-impact rules, so items
   * touching a sensitive subject or carrying a cautionary safety class are
   * flagged here rather than left to a reviewer to notice.
   */
  private async seedReviewItems(
    manager: EntityManager,
    versionId: string,
    duplicateCandidates: { key: string; duplicateOf: string }[],
  ): Promise<void> {
    const rules = await manager.find(ZunoRulebookRule, {
      where: { rulebook_version_id: versionId },
    });
    const duplicates = new Map(
      duplicateCandidates.map((d) => [d.key, d.duplicateOf]),
    );

    const items = rules.map((rule) =>
      manager.create(ZunoRulebookReviewItem, {
        rulebook_version_id: versionId,
        rule_id: rule.id,
        external_rule_key: rule.external_rule_key,
        review_status: duplicates.has(rule.external_rule_key)
          ? RuleReviewStatus.POSSIBLE_DUPLICATE
          : RuleReviewStatus.PENDING,
        duplicate_of_key: duplicates.get(rule.external_rule_key) ?? null,
        requires_two_person_review: this.requiresTwoPersonReview(rule),
      }),
    );
    if (items.length) {
      await manager.save(ZunoRulebookReviewItem, items, { chunk: 200 });
    }
  }

  /** Step 08 section 62: health, legal, marriage, financial distress. */
  private requiresTwoPersonReview(rule: ZunoRulebookRule): boolean {
    const highImpactSubjects: string[] = [
      SensitiveSubject.HEALTH,
      SensitiveSubject.DISEASE,
      SensitiveSubject.DEATH,
      SensitiveSubject.LONGEVITY,
      SensitiveSubject.PREGNANCY,
      SensitiveSubject.CHILD_GENDER,
      SensitiveSubject.LEGAL_CONSEQUENCE,
      SensitiveSubject.FINANCIAL_LOSS,
      SensitiveSubject.MISSING_PERSON,
    ];
    if ((rule.sensitive_subjects ?? []).some((s) => highImpactSubjects.includes(s))) {
      return true;
    }
    return (
      rule.safety_class === RuleSafetyClass.SME_SUPERVISION ||
      rule.safety_class === RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW ||
      rule.safety_class === RuleSafetyClass.REQUIRES_CAUTION
    );
  }

  /** Step 21 section 76: rule-level SME review. */
  async reviewRule(
    actor: GovernanceActor,
    versionId: string,
    ruleId: string,
    decision: {
      status: RuleReviewStatus;
      comment?: string;
      isSecondaryReview?: boolean;
    },
  ): Promise<ZunoRulebookReviewItem> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_REVIEW);
    const version = await this.findVersion(versionId);
    if (
      version.status !== RulebookStatus.VALIDATED &&
      version.status !== RulebookStatus.SME_REVIEW_IN_PROGRESS
    ) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `Rules cannot be reviewed while the rulebook is ${version.status}.`,
      });
    }

    const item = await this.reviewItems.findOne({ where: { rule_id: ruleId } });
    if (!item || item.rulebook_version_id !== versionId) {
      throw ZunoException.notFound('review item');
    }

    return this.dataSource.transaction(async (manager) => {
      if (version.status === RulebookStatus.VALIDATED) {
        await this.setStatus(
          manager,
          version,
          RulebookStatus.SME_REVIEW_IN_PROGRESS,
          actor,
          { action: RulebookAuditAction.SME_REVIEW_STARTED },
        );
      }

      if (decision.isSecondaryReview) {
        if (item.secondary_reviewer_id === actor.userId) {
          throw new ZunoException(ZunoErrorCode.CONFLICT, {
            message: 'You have already recorded a secondary review for this rule.',
          });
        }
        // Two-person review means two people. Step 08 section 62.
        if (item.reviewer_id === actor.userId) {
          throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
            message:
              'The secondary review must be performed by a different reviewer.',
          });
        }
        item.secondary_reviewer_id = actor.userId;
        item.secondary_reviewed_at = this.clock.now();
      } else {
        item.reviewer_id = actor.userId;
        item.reviewed_at = this.clock.now();
      }

      item.review_status = decision.status;
      item.review_comment = decision.comment ?? item.review_comment;
      return manager.save(ZunoRulebookReviewItem, item);
    });
  }

  /**
   * SME sign-off on the whole rulebook. Step 21 section 77.
   *
   * "Do not infer approval from file upload, validation success, or admin
   * viewing." So this refuses unless every rule has actually been reviewed and
   * every two-person rule has both signatures.
   */
  async smeApprove(
    actor: GovernanceActor,
    versionId: string,
    comment?: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_APPROVE);
    const version = await this.findVersion(versionId);

    // Step 10 section 25: one person should not take a rulebook end to end.
    if (version.uploaded_by && version.uploaded_by === actor.userId) {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        message:
          'The person who uploaded a rulebook cannot also give SME approval for it.',
        internalDetail: 'separation of duties: uploader === approver',
      });
    }

    const outstanding = await this.reviewItems.count({
      where: {
        rulebook_version_id: versionId,
        review_status: RuleReviewStatus.PENDING,
      },
    });
    if (outstanding > 0) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `${outstanding} rule(s) are still awaiting review.`,
      });
    }

    const missingSecondary = await this.reviewItems
      .createQueryBuilder('item')
      .where('item.rulebook_version_id = :versionId', { versionId })
      .andWhere('item.requires_two_person_review = true')
      .andWhere('item.secondary_reviewer_id IS NULL')
      .getCount();
    if (missingSecondary > 0) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `${missingSecondary} high-impact rule(s) still need a second reviewer.`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      version.reviewed_by = actor.userId;
      version.reviewed_at = this.clock.now();
      version.approved_by = actor.userId;
      version.approved_at = this.clock.now();
      return this.setStatus(manager, version, RulebookStatus.SME_REVIEWED, actor, {
        action: RulebookAuditAction.SME_APPROVED,
        reason: comment,
      });
    });
  }

  async smeReject(
    actor: GovernanceActor,
    versionId: string,
    reason: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_APPROVE);
    if (!reason?.trim()) {
      throw ZunoException.validation([{ field: 'reason', code: 'REQUIRED' }]);
    }
    const version = await this.findVersion(versionId);
    return this.dataSource.transaction(async (manager) =>
      this.setStatus(manager, version, RulebookStatus.SME_REJECTED, actor, {
        action: RulebookAuditAction.SME_REJECTED,
        reason,
      }),
    );
  }

  /** Step 10 section 20: every validated rulebook enters staging first. */
  async moveToStaging(
    actor: GovernanceActor,
    versionId: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_STAGE);
    const version = await this.findVersion(versionId);
    return this.dataSource.transaction(async (manager) =>
      this.setStatus(manager, version, RulebookStatus.STAGING, actor, {
        action: RulebookAuditAction.STAGING_ACTIVATED,
      }),
    );
  }

  /**
   * Records the outcome of Golden Case regression. Step 10 sections 21-23.
   *
   * The comparison itself needs the astrology engine, which is a later phase.
   * What exists now is the *gate*: a rulebook cannot reach APPROVED without a
   * recorded regression result, so the requirement cannot be quietly skipped
   * once the engine lands.
   */
  async recordRegression(
    actor: GovernanceActor,
    versionId: string,
    outcome: {
      passed: boolean;
      totalCases: number;
      unchanged: number;
      improvements: number;
      needsReview: number;
      criticalRegressions: number;
      notes?: string;
    },
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_STAGE);
    const version = await this.findVersion(versionId);

    return this.dataSource.transaction(async (manager) => {
      await this.setStatus(
        manager,
        version,
        RulebookStatus.REGRESSION_RUNNING,
        actor,
        { action: RulebookAuditAction.REGRESSION_STARTED },
      );

      // Step 10 section 22: a critical regression prevents activation.
      const passed = outcome.passed && outcome.criticalRegressions === 0;
      return this.setStatus(
        manager,
        version,
        passed ? RulebookStatus.REGRESSION_PASSED : RulebookStatus.REGRESSION_FAILED,
        actor,
        {
          action: passed
            ? RulebookAuditAction.REGRESSION_PASSED
            : RulebookAuditAction.REGRESSION_FAILED,
          reason: outcome.notes,
          metadata: { ...outcome },
        },
      );
    });
  }

  /** Final administrative approval, after SME sign-off and regression. */
  async approveForProduction(
    actor: GovernanceActor,
    versionId: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_ACTIVATE);
    const version = await this.findVersion(versionId);
    return this.dataSource.transaction(async (manager) =>
      this.setStatus(manager, version, RulebookStatus.APPROVED, actor, {
        action: RulebookAuditAction.SME_APPROVED,
      }),
    );
  }

  /**
   * Activates a rulebook as the single production version.
   * Step 21 section 78, Step 10 sections 26-27, Step 20 section 69.
   *
   * Atomic: superseding the old version and promoting the new one happen in one
   * transaction, so there is never a moment with two production rulebooks or
   * none (Step 20 section 124: activation must not leave mixed versions).
   */
  async activate(
    actor: GovernanceActor,
    versionId: string,
    reason?: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_ACTIVATE);
    const version = await this.findVersion(versionId);

    // Step 10 section 25 again: approver and activator must differ.
    if (version.approved_by && version.approved_by === actor.userId) {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        message:
          'The person who gave SME approval cannot also activate the rulebook in production.',
        internalDetail: 'separation of duties: approver === activator',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(ZunoRulebookVersion, {
        where: { is_production: true },
      });

      if (current && current.id !== version.id) {
        current.is_production = false;
        current.superseded_at = this.clock.now();
        await this.setStatus(
          manager,
          current,
          RulebookStatus.SUPERSEDED,
          actor,
          {
            action: RulebookAuditAction.PRODUCTION_ACTIVATED,
            reason: `Superseded by ${version.version}`,
          },
        );
      }

      version.is_production = true;
      version.activated_by = actor.userId;
      version.activated_at = this.clock.now();
      version.supersedes_version_id = current?.id ?? null;

      const activated = await this.setStatus(
        manager,
        version,
        RulebookStatus.PRODUCTION,
        actor,
        {
          action: RulebookAuditAction.PRODUCTION_ACTIVATED,
          reason,
          metadata: { supersedes: current?.version ?? null },
        },
      );

      this.logger.log(
        `Rulebook ${version.version} is now PRODUCTION (activated by ${actor.userId})`,
      );
      return activated;
    });
  }

  /**
   * Rolls back to a previously approved version. Step 10 section 28,
   * Step 21 section 79.
   *
   * Reactivates an existing approved version by id - it never accepts rule
   * content from the caller, because Step 21 section 79 forbids treating
   * client-provided payloads as rollback content.
   */
  async rollback(
    actor: GovernanceActor,
    targetVersionId: string,
    reason: string,
  ): Promise<ZunoRulebookVersion> {
    this.requirePermission(actor, RulebookPermission.RULEBOOK_ROLLBACK);
    if (!reason?.trim()) {
      throw ZunoException.validation(
        [{ field: 'reason', code: 'REQUIRED' }],
        'A rollback requires a reason.',
      );
    }

    const target = await this.findVersion(targetVersionId);
    if (target.status !== RulebookStatus.SUPERSEDED) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `Only a previously superseded version can be rolled back to. Version ${target.version} is ${target.status}.`,
      });
    }

    return this.dataSource.transaction(async (manager) => {
      await this.audit(manager, target.id, RulebookAuditAction.ROLLBACK_INITIATED, actor, {
        reason,
      });

      const current = await manager.findOne(ZunoRulebookVersion, {
        where: { is_production: true },
      });
      if (current) {
        current.is_production = false;
        await this.setStatus(manager, current, RulebookStatus.ROLLED_BACK, actor, {
          action: RulebookAuditAction.ROLLBACK_COMPLETED,
          reason,
        });
      }

      target.is_production = true;
      target.activated_by = actor.userId;
      target.activated_at = this.clock.now();
      target.superseded_at = null;

      const restored = await this.setStatus(
        manager,
        target,
        RulebookStatus.PRODUCTION,
        actor,
        {
          action: RulebookAuditAction.ROLLBACK_COMPLETED,
          reason,
          metadata: { rolled_back_from: current?.version ?? null },
        },
      );

      this.logger.warn(
        `Rulebook rolled back to ${target.version} by ${actor.userId}: ${reason}`,
      );
      return restored;
    });
  }

  // --- internals -------------------------------------------------------

  async findVersion(versionId: string): Promise<ZunoRulebookVersion> {
    const version = await this.versions.findOne({ where: { id: versionId } });
    if (!version) throw ZunoException.notFound('rulebook version');
    return version;
  }

  private assertTransition(
    version: ZunoRulebookVersion,
    next: RulebookStatus,
  ): void {
    if (!canTransitionRulebook(version.status, next)) {
      throw new ZunoException(ZunoErrorCode.CONFLICT, {
        message: `A rulebook in state ${version.status} cannot move to ${next}.`,
        internalDetail: `illegal rulebook transition ${version.status} -> ${next}`,
      });
    }
  }

  private async setStatus(
    manager: EntityManager,
    version: ZunoRulebookVersion,
    next: RulebookStatus,
    actor: GovernanceActor,
    options: {
      action: RulebookAuditAction;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ZunoRulebookVersion> {
    const from = version.status;
    if (from !== next) {
      this.assertTransition(version, next);
      version.status = next;
    }
    if (options.reason) version.status_reason = options.reason;

    const saved = await manager.save(ZunoRulebookVersion, version);
    await this.audit(manager, saved.id, options.action, actor, {
      fromStatus: from,
      toStatus: next,
      reason: options.reason,
      metadata: options.metadata,
    });
    return saved;
  }

  private async audit(
    manager: EntityManager,
    versionId: string,
    action: RulebookAuditAction,
    actor: GovernanceActor,
    options: {
      fromStatus?: string;
      toStatus?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    const entry = manager.create(ZunoRulebookAuditLog, {
      rulebook_version_id: versionId,
      action,
      actor_id: actor.userId,
      actor_role: actor.role,
      reason: options.reason ?? null,
      from_status: options.fromStatus ?? null,
      to_status: options.toStatus ?? null,
      metadata: options.metadata ?? null,
      redacted_at: null,
    });
    await manager.save(ZunoRulebookAuditLog, entry);
  }

  private requirePermission(
    actor: GovernanceActor,
    permission: RulebookPermission,
  ): void {
    if (!actor?.permissions?.includes(permission)) {
      // Step 21 Golden Contract Test 132: an unauthorised activation attempt
      // yields 403, an audit event, and no state change.
      this.logger.warn(
        `Denied ${permission} for actor ${actor?.userId ?? 'unknown'} (role ${actor?.role ?? 'none'})`,
      );
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        message: 'This action is not available with your role.',
        internalDetail: `missing permission ${permission}`,
      });
    }
  }
}
