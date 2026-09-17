import { Column, Entity, Index } from 'typeorm';
import {
  ZunoBaseEntity,
  ZunoImmutableEntity,
} from '../../common/entities/zuno-base.entity';
import {
  RuleReviewStatus,
  RulebookAuditAction,
  ValidationSeverity,
} from '../../common/enums';

/** One problem found while validating a workbook. */
export interface ValidationFinding {
  severity: ValidationSeverity;
  /** Stable code, e.g. MISSING_COLUMN, DUPLICATE_RULE_ID, BROKEN_REFERENCE. */
  code: string;
  sheet?: string;
  row?: number;
  column?: string;
  /** Which SME entity it concerns, e.g. ASTRO-CAREER-001. */
  entity_key?: string;
  message: string;
}

/**
 * One validation pass over an uploaded workbook.
 * Step 20 Data Model section 71, Step 10 sections 10-17.
 *
 * Step 10 section 40: if validation fails, production is unaffected. A failed
 * run is recorded rather than discarded, so an admin can see exactly which
 * rows the SME needs to fix.
 */
@Entity('zuno_rulebook_validation_runs')
@Index('idx_zuno_validation_version', ['rulebook_version_id', 'created_at'])
export class ZunoRulebookValidationRun extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'varchar', length: 32, name: 'validator_version' })
  validator_version: string;

  @Column({ type: 'varchar', length: 24 })
  status: 'RUNNING' | 'PASSED' | 'PASSED_WITH_WARNINGS' | 'FAILED';

  @Column({ type: 'int', name: 'total_rules', default: 0 })
  total_rules: number;

  @Column({ type: 'int', name: 'valid_rules', default: 0 })
  valid_rules: number;

  @Column({ type: 'int', name: 'invalid_rules', default: 0 })
  invalid_rules: number;

  @Column({ type: 'int', name: 'error_count', default: 0 })
  error_count: number;

  @Column({ type: 'int', name: 'warning_count', default: 0 })
  warning_count: number;

  /**
   * Full finding list, row and column addressable.
   *
   * Capped by the validator before persisting - a malformed workbook can
   * otherwise generate one finding per cell and bloat the row.
   */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  findings: ValidationFinding[];

  @Column({ type: 'timestamptz', name: 'started_at' })
  started_at: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completed_at: Date | null;
}

/**
 * SME review state for a single rule. Step 20 section 72.
 *
 * Backs the SME Review Dashboard (Step 21 section 75). Review happens rule by
 * rule because Step 08 section 62 wants two-person review on high-impact rules
 * - health, legal, marriage, financial distress - and that is impossible if
 * approval is only ever granted for a whole workbook at once.
 */
@Entity('zuno_rulebook_review_items')
@Index('idx_zuno_review_version', ['rulebook_version_id', 'review_status'])
@Index('idx_zuno_review_rule', ['rule_id'], { unique: true })
export class ZunoRulebookReviewItem extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'uuid', name: 'rule_id' })
  rule_id: string;

  /** Denormalised so the dashboard can list without joining. */
  @Column({ type: 'varchar', length: 64, name: 'external_rule_key' })
  external_rule_key: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'review_status',
    default: RuleReviewStatus.PENDING,
  })
  review_status: RuleReviewStatus;

  @Column({ type: 'uuid', name: 'reviewer_id', nullable: true })
  reviewer_id: string | null;

  @Column({ type: 'text', name: 'review_comment', nullable: true })
  review_comment: string | null;

  @Column({ type: 'timestamptz', name: 'reviewed_at', nullable: true })
  reviewed_at: Date | null;

  /**
   * Second reviewer for high-impact rules. Step 08 section 62.
   * Null when the rule does not require two-person review.
   */
  @Column({ type: 'uuid', name: 'secondary_reviewer_id', nullable: true })
  secondary_reviewer_id: string | null;

  @Column({ type: 'timestamptz', name: 'secondary_reviewed_at', nullable: true })
  secondary_reviewed_at: Date | null;

  @Column({ type: 'boolean', name: 'requires_two_person_review', default: false })
  requires_two_person_review: boolean;

  /**
   * True when this rule duplicates another. Step 10 section 15: the system
   * flags duplicates but must never delete them automatically - the SME
   * decides.
   */
  @Column({ type: 'varchar', length: 64, name: 'duplicate_of_key', nullable: true })
  duplicate_of_key: string | null;
}

/**
 * Immutable governance audit trail. Step 10 sections 36-37,
 * Step 20 section 73.
 *
 * Every lifecycle action writes a row here. Kept separate from the general
 * ZunoAuditEvent table because rulebook governance has its own reviewer model,
 * its own event vocabulary, and a retention profile tied to the rulebook rather
 * than to a user - and because an auditor asking "who activated 1.5.0 and why"
 * should not have to filter it out of application-wide audit noise.
 */
@Entity('zuno_rulebook_audit_log')
@Index('idx_zuno_rulebook_audit_version', ['rulebook_version_id', 'created_at'])
export class ZunoRulebookAuditLog extends ZunoImmutableEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'varchar', length: 48 })
  action: RulebookAuditAction;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actor_id: string | null;

  /** Role the actor used, so separation of duties is auditable afterwards. */
  @Column({ type: 'varchar', length: 32, name: 'actor_role', nullable: true })
  actor_role: string | null;

  /** Required for rejection, activation and rollback (Step 10 section 28). */
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 40, name: 'from_status', nullable: true })
  from_status: string | null;

  @Column({ type: 'varchar', length: 40, name: 'to_status', nullable: true })
  to_status: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
