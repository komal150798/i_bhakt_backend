import { Column, Entity, Index } from 'typeorm';
import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import {
  MkaDimension,
  RemedyFrequency,
  RemedyType,
  RuleSafetyClass,
  RuleStatus,
  RuleTheme,
  ThemeStrength,
  TimingWindowType,
  ZunoDomain,
} from '../../common/enums';

/**
 * SME-approved meaning for a theme. Step 08 sections 24-25.
 *
 * The critical constraint is Step 08 sections 26-28. This text is the
 * *meaning*, not the final copy. The response composer may change tone, length,
 * structure and personalisation - but never the astrological meaning,
 * direction, timing or severity.
 *
 * The forbidden transformation, spelled out in section 28: if the SME wrote
 * "career volatility is elevated", the AI may not turn that into either
 * "you will lose your job" or "your job is completely safe".
 */
@Entity('zuno_rulebook_interpretations')
@Index(
  'idx_zuno_interpretations_key',
  ['rulebook_version_id', 'external_interpretation_key'],
  { unique: true },
)
export class ZunoRulebookInterpretation extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  /** SME's own ID, e.g. INT-CAREER-001. */
  @Column({ type: 'varchar', length: 64, name: 'external_interpretation_key' })
  external_interpretation_key: string;

  @Column({ type: 'varchar', length: 48, nullable: true })
  theme: RuleTheme | null;

  /** The SME's approved meaning. Never shown verbatim; never contradicted. */
  @Column({ type: 'text' })
  meaning: string;

  /**
   * Domains this interpretation may be used in. Prevents a career
   * interpretation leaking into a health response.
   */
  @Column({ type: 'jsonb', name: 'allowed_domains', default: () => "'[]'::jsonb" })
  allowed_domains: ZunoDomain[];

  /** Plainer phrasing the SME approves for direct user display, if any. */
  @Column({ type: 'text', name: 'user_safe_summary', nullable: true })
  user_safe_summary: string | null;

  @Column({ type: 'varchar', length: 24, default: RuleStatus.DRAFT })
  status: RuleStatus;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}

/**
 * A timing window definition. Step 08 sections 29-33, Step 07 sections 59-64.
 *
 * Step 08 section 33 and Step 07 section 61 are emphatic: a timing window is
 * NOT an event prediction. "This period may need preparation" is allowed;
 * "you will get a job in March" is not.
 */
@Entity('zuno_rulebook_timing_rules')
@Index('idx_zuno_timing_key', ['rulebook_version_id', 'external_timing_key'], {
  unique: true,
})
export class ZunoRulebookTimingRule extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  /** SME's own ID, e.g. TIME-CAREER-014. */
  @Column({ type: 'varchar', length: 64, name: 'external_timing_key' })
  external_timing_key: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  domain: ZunoDomain | null;

  @Column({ type: 'varchar', length: 32, name: 'window_type' })
  window_type: TimingWindowType;

  @Column({ type: 'varchar', length: 16 })
  strength: ThemeStrength;

  /**
   * How the window is derived - from Mahadasha, Bhukti, Antara, transit or a
   * combination. Step 08 section 29 leaves the interaction to the SME.
   */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  conditions: Record<string, unknown>[];

  /** SME-approved wording for how this window should be described. */
  @Column({ type: 'text', name: 'timing_language', nullable: true })
  timing_language: string | null;

  @Column({ type: 'varchar', length: 24, default: RuleStatus.DRAFT })
  status: RuleStatus;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}

/**
 * An SME-approved remedy. Step 08 sections 39-59.
 *
 * Build Rule 12 of the Master Index and Build Rule 51: ZUNO must never invent a
 * remedy. Everything a user is ever told to do astrologically originates in a
 * row of this table, authored by the SME.
 *
 * Consumer-facing defaults lean on LOW_RISK remedies (section 51) that carry no
 * financial burden (section 52). Gemstones need their own SME and safety
 * framework before they can be introduced at all (section 53).
 */
@Entity('zuno_rulebook_remedies')
@Index('idx_zuno_remedies_key', ['rulebook_version_id', 'external_remedy_key'], {
  unique: true,
})
@Index('idx_zuno_remedies_type', ['rulebook_version_id', 'remedy_type'])
export class ZunoRulebookRemedy extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  /** SME's own ID, e.g. REM-MANTRA-001. */
  @Column({ type: 'varchar', length: 64, name: 'external_remedy_key' })
  external_remedy_key: string;

  @Column({ type: 'varchar', length: 300 })
  name: string;

  @Column({ type: 'varchar', length: 32, name: 'remedy_type' })
  remedy_type: RemedyType;

  /**
   * Which of Mind / Karma / Action this becomes in the user's programme.
   * Step 08 section 43.
   */
  @Column({ type: 'varchar', length: 16, name: 'mka_dimension' })
  mka_dimension: MkaDimension;

  @Column({ type: 'text' })
  purpose: string;

  /** Why this remedy applies astrologically. Internal; supports SME review. */
  @Column({ type: 'text', name: 'astrological_basis', nullable: true })
  astrological_basis: string | null;

  /**
   * Exact instructions, preserved character for character.
   *
   * Step 08 section 48 requires exact mantra preservation - a mantra that an
   * AI has "improved" or paraphrased is a different mantra, and not one the
   * SME approved. Nothing in the pipeline rewrites this field.
   */
  @Column({ type: 'text' })
  instructions: string;

  @Column({ type: 'varchar', length: 24 })
  frequency: RemedyFrequency;

  @Column({ type: 'varchar', length: 64, nullable: true })
  duration: string | null;

  @Column({ type: 'varchar', length: 120, name: 'preferred_time', nullable: true })
  preferred_time: string | null;

  @Column({ type: 'text', nullable: true })
  restrictions: string | null;

  /** Remedies that must not be combined with this one. Step 08 section 50. */
  @Column({ type: 'jsonb', name: 'conflicts_with', default: () => "'[]'::jsonb" })
  conflicts_with: string[];

  @Column({
    type: 'varchar',
    length: 32,
    name: 'safety_class',
    default: RuleSafetyClass.LOW_RISK,
  })
  safety_class: RuleSafetyClass;

  /**
   * Whether following this remedy costs money. Step 08 section 52: ZUNO must
   * not make a user believe expensive purchases are necessary for outcomes.
   */
  @Column({ type: 'boolean', name: 'has_financial_cost', default: false })
  has_financial_cost: boolean;

  /**
   * Whether the remedy is devotional in nature, so it can be withheld from
   * users who prefer practical-only guidance (Step 08 sections 57-59).
   */
  @Column({ type: 'boolean', name: 'is_devotional', default: false })
  is_devotional: boolean;

  /** SME-approved alternative remedy keys. Step 08 section 56. */
  @Column({ type: 'jsonb', name: 'alternative_keys', default: () => "'[]'::jsonb" })
  alternative_keys: string[];

  /** Plain-language reason the user can be shown. Step 08 section 49. */
  @Column({ type: 'text', name: 'user_explanation', nullable: true })
  user_explanation: string | null;

  @Column({ type: 'varchar', length: 24, default: RuleStatus.DRAFT })
  status: RuleStatus;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}

/**
 * Per-domain astrological methodology. Step 08 sections 12-13.
 *
 * Step 08 section 11 is explicit that a domain is NOT simply a house:
 * "Do not implement simplistic mappings such as Career = House 10."
 *
 * Every field here is SME-defined. Step 08 section 13 ends with a direct
 * instruction - "Do not fill SME_DEFINED using generic astrology assumptions" -
 * which is why this is a table the SME populates and not a constant in code.
 */
@Entity('zuno_rulebook_domain_configs')
@Index('idx_zuno_domain_config', ['rulebook_version_id', 'domain'], {
  unique: true,
})
export class ZunoRulebookDomainConfig extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'varchar', length: 32 })
  domain: ZunoDomain;

  @Column({ type: 'jsonb', name: 'primary_houses', default: () => "'[]'::jsonb" })
  primary_houses: number[];

  @Column({ type: 'jsonb', name: 'secondary_houses', default: () => "'[]'::jsonb" })
  secondary_houses: number[];

  @Column({ type: 'jsonb', name: 'primary_planets', default: () => "'[]'::jsonb" })
  primary_planets: string[];

  @Column({ type: 'jsonb', name: 'supporting_planets', default: () => "'[]'::jsonb" })
  supporting_planets: string[];

  @Column({
    type: 'jsonb',
    name: 'relevant_divisional_charts',
    default: () => "'[]'::jsonb",
  })
  relevant_divisional_charts: string[];

  @Column({ type: 'jsonb', name: 'timing_factors', default: () => "'[]'::jsonb" })
  timing_factors: string[];

  @Column({ type: 'text', name: 'methodology_notes', nullable: true })
  methodology_notes: string | null;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}

/**
 * SME-defined conflict resolution. Step 08 section 50, Step 10 section 16.
 *
 * Two rules can produce opposing findings for the same chart. Step 10
 * section 16 closes with a hard instruction:
 *
 *   "Claude must never invent the conflict-resolution hierarchy."
 *
 * So this table holds the SME's precedence decisions. Where no rule covers a
 * conflict, the engine falls back safely and raises an SME review candidate
 * (Build Rule 59) rather than picking a winner.
 */
@Entity('zuno_rulebook_conflict_rules')
@Index('idx_zuno_conflict_key', ['rulebook_version_id', 'external_conflict_key'], {
  unique: true,
})
export class ZunoRulebookConflictRule extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'varchar', length: 64, name: 'external_conflict_key' })
  external_conflict_key: string;

  /** The rule keys that can conflict with each other. */
  @Column({ type: 'jsonb', name: 'rule_keys', default: () => "'[]'::jsonb" })
  rule_keys: string[];

  /**
   * How the SME resolves it, e.g. DASHA_PRECEDENCE, HOUSE_HIERARCHY,
   * PRESERVE_BOTH. Vocabulary is the SME's; the engine only applies it.
   */
  @Column({ type: 'varchar', length: 64, name: 'resolution_strategy' })
  resolution_strategy: string;

  /** Which rule key wins, when the strategy names a single winner. */
  @Column({ type: 'varchar', length: 64, name: 'winning_rule_key', nullable: true })
  winning_rule_key: string | null;

  @Column({ type: 'text', nullable: true })
  rationale: string | null;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}

/**
 * An SME-approved regression case. Step 08 sections 70-72, Step 10 sections 21-23.
 *
 * These are what make a rulebook upgrade safe: the same birth data and
 * challenge are run against both the current production rulebook and the
 * candidate, and the SME reviews what changed. Step 10 section 22: a critical
 * regression prevents activation.
 */
@Entity('zuno_rulebook_golden_cases')
@Index('idx_zuno_golden_key', ['rulebook_version_id', 'external_case_key'], {
  unique: true,
})
export class ZunoRulebookGoldenCase extends ZunoBaseEntity {
  @Column({ type: 'uuid', name: 'rulebook_version_id' })
  rulebook_version_id: string;

  @Column({ type: 'varchar', length: 64, name: 'external_case_key' })
  external_case_key: string;

  @Column({ type: 'varchar', length: 300, name: 'case_name' })
  case_name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  domain: ZunoDomain | null;

  /**
   * Synthetic birth data for the fixture.
   *
   * Build Rule 175: never seed a demo with real user data. Build Rule 176:
   * personas such as Ashish are synthetic fixtures, never production
   * hard-coding. Validation rejects a golden case that references a real user.
   */
  @Column({ type: 'jsonb', name: 'birth_data' })
  birth_data: Record<string, unknown>;

  @Column({ type: 'text', name: 'challenge_statement' })
  challenge_statement: string;

  /** Rule keys the SME expects to fire for this case. */
  @Column({ type: 'jsonb', name: 'expected_rule_keys', default: () => "'[]'::jsonb" })
  expected_rule_keys: string[];

  @Column({ type: 'jsonb', name: 'expected_themes', default: () => "'[]'::jsonb" })
  expected_themes: string[];

  @Column({ type: 'text', name: 'expected_outcome_notes', nullable: true })
  expected_outcome_notes: string | null;

  @Column({ type: 'int', name: 'source_row', nullable: true })
  source_row: number | null;
}
