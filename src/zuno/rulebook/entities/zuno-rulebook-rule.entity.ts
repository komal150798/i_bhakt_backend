import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import {
  RuleConditionOperator,
  RuleConditionType,
  RuleFactorRole,
  RuleSafetyClass,
  RuleStatus,
  RuleTheme,
  SmeConfidence,
  ThemeDirection,
  ThemeStrength,
  ZunoDomain,
} from '../../common/enums';
import { ZunoRulebookVersion } from './zuno-rulebook-version.entity';

/**
 * One astrological condition within a rule. Step 08 sections 14-18.
 *
 * Stored as JSONB on the rule rather than as its own table: conditions are
 * always read as a complete set when evaluating a rule and are never queried
 * independently, which is exactly the case Step 20 section 9 permits JSONB for.
 */
export interface RuleCondition {
  type: RuleConditionType;
  role: RuleFactorRole;
  /** Combines with the preceding condition. Defaults to AND. */
  operator?: RuleConditionOperator;
  /** e.g. MERCURY. Vocabulary comes from the workbook, not from code. */
  planet?: string;
  house?: number;
  sign?: string;
  nakshatra?: string;
  aspect_to?: string;
  divisional_chart?: string;
  /** Anything the SME expressed that does not fit the typed fields above. */
  parameters?: Record<string, unknown>;
  /** The SME's own wording, preserved verbatim for review and audit. */
  raw_expression: string;
}

/**
 * A normalized SME astrology rule.
 * Step 20 Data Model section 67, Step 08 section 8, Step 10 section 18.
 *
 * Nothing in this table is written by ZUNO. Every row is compiled from the
 * SME's workbook, which is what Step 10 section 47 demands:
 *
 *   "Do not hard-code astrological rules into ... source code, or LLM system
 *    prompts."
 *
 * Rules become immutable once their rulebook reaches PRODUCTION
 * (Step 20 section 68). Changing a rule means a new rulebook version.
 */
@Entity('zuno_rulebook_rules')
@Index('idx_zuno_rules_version_key', ['rulebook_version_id', 'external_rule_key'], {
  unique: true,
})
@Index('idx_zuno_rules_domain', ['rulebook_version_id', 'domain', 'status'])
@Index('idx_zuno_rules_theme', ['rulebook_version_id', 'theme'])
export class ZunoRulebookRule extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  /**
   * The SME's own rule ID, e.g. ASTRO-CAREER-001 (Step 08 section 9).
   *
   * Step 10 section 13: once approved, a Rule ID is permanent and must never
   * be reused for a different rule. It is what links a two-year-old response
   * back to the reasoning that produced it, so it is stored as given and never
   * regenerated.
   */
  @Column({ type: 'varchar', length: 64, name: 'external_rule_key' })
  external_rule_key: string;

  @Column({ type: 'varchar', length: 300, name: 'rule_name' })
  rule_name: string;

  @Column({ type: 'varchar', length: 32 })
  domain: ZunoDomain;

  @Column({ type: 'varchar', length: 64, nullable: true })
  subcategory: string | null;

  /** The astrological conditions. Step 08 sections 14-18. */
  @Column({ type: 'jsonb', name: 'conditions', default: () => "'[]'::jsonb" })
  conditions: RuleCondition[];

  // --- Structured output (Step 08 sections 19-22) ---

  @Column({ type: 'varchar', length: 48 })
  theme: RuleTheme;

  @Column({ type: 'varchar', length: 16 })
  direction: ThemeDirection;

  @Column({ type: 'varchar', length: 16 })
  strength: ThemeStrength;

  // --- Cross-references, validated for referential integrity (Step 10 §14) ---

  @Column({
    type: 'varchar',
    length: 64,
    name: 'interpretation_key',
    nullable: true,
  })
  interpretation_key: string | null;

  @Column({ type: 'jsonb', name: 'timing_rule_keys', default: () => "'[]'::jsonb" })
  timing_rule_keys: string[];

  @Column({ type: 'jsonb', name: 'remedy_keys', default: () => "'[]'::jsonb" })
  remedy_keys: string[];

  @Column({ type: 'jsonb', name: 'conflict_rule_keys', default: () => "'[]'::jsonb" })
  conflict_rule_keys: string[];

  // --- Governance (Step 08 sections 60-69) ---

  @Column({ type: 'varchar', length: 24, default: RuleStatus.DRAFT })
  status: RuleStatus;

  @Column({ type: 'varchar', length: 32, name: 'safety_class' })
  safety_class: RuleSafetyClass;

  /**
   * Sensitive subjects this rule touches. Step 10 section 17 requires enhanced
   * governance for health, death, legal consequence and similar.
   */
  @Column({ type: 'jsonb', name: 'sensitive_subjects', default: () => "'[]'::jsonb" })
  sensitive_subjects: string[];

  @Column({
    type: 'varchar',
    length: 24,
    name: 'sme_confidence',
    default: SmeConfidence.CONTEXT_DEPENDENT,
  })
  sme_confidence: SmeConfidence;

  /** Internal only. Step 08 section 67: never exposed to consumers. */
  @Column({ type: 'text', name: 'sme_comment', nullable: true })
  sme_comment: string | null;

  /** Step 08 section 64: methodology can evolve without rewriting history. */
  @Column({ type: 'date', name: 'effective_from', nullable: true })
  effective_from: string | null;

  @Column({ type: 'date', name: 'effective_until', nullable: true })
  effective_until: string | null;

  /** Rule-level version, distinct from the rulebook version (Step 08 §63). */
  @Column({ type: 'varchar', length: 16, name: 'rule_version', default: '1.0' })
  rule_version: string;

  @Column({ type: 'text', name: 'change_reason', nullable: true })
  change_reason: string | null;

  /** Which workbook row this came from, so validation errors are actionable. */
  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;

  @ManyToOne(() => ZunoRulebookVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rulebook_version_id' })
  rulebook_version?: ZunoRulebookVersion;

  /**
   * Whether this rule may generate user-facing guidance.
   *
   * Three independent gates, all of which must pass (Step 08 section 61,
   * section 69, Step 10 section 17). Kept as a method rather than a stored
   * column so it cannot drift from the fields it depends on.
   */
  isProductionEligible(): boolean {
    if (this.status !== RuleStatus.APPROVED) return false;
    if (this.sme_confidence === SmeConfidence.EXPERIMENTAL) return false;
    if (
      this.safety_class === RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW ||
      this.safety_class === RuleSafetyClass.SME_SUPERVISION
    ) {
      return false;
    }
    return true;
  }
}
