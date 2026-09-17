import { RulebookSheet } from '../../common/enums';

export interface ColumnSpec {
  /** Column header as it appears in the workbook. Matched case-insensitively. */
  header: string;
  /** Property name on the parsed row. */
  field: string;
  required: boolean;
  /** Accepted alternative headers, so a small rename does not fail the upload. */
  aliases?: string[];
  description: string;
}

export interface SheetSpec {
  sheet: RulebookSheet;
  required: boolean;
  columns: ColumnSpec[];
  description: string;
}

/**
 * The expected shape of an SME Rulebook workbook.
 * Step 10 sections 11-12.
 *
 * This is the contract between the astrologer's spreadsheet and ZUNO. It is
 * deliberately declarative: the same definition drives validation, parsing and
 * the blank template generator, so a template can never drift from what the
 * validator accepts.
 *
 * Header matching is case-insensitive and whitespace-tolerant, with aliases,
 * because the SME is working in Excel and a capital letter should not fail a
 * 1600-row upload. Anything beyond that - a missing mandatory column, an
 * unknown enum value - fails loudly, per Step 10 section 12.
 */
export const RULEBOOK_WORKBOOK_SCHEMA: readonly SheetSpec[] = [
  {
    sheet: RulebookSheet.CONFIGURATION,
    required: false,
    description:
      'Rulebook-level settings: ayanamsa, house system, calculation methodology. Step 08 sections 4-6.',
    columns: [
      { header: 'Setting', field: 'setting', required: true, description: 'Configuration key, e.g. AYANAMSA' },
      { header: 'Value', field: 'value', required: true, description: 'Configured value, e.g. LAHIRI' },
      { header: 'Notes', field: 'notes', required: false, description: 'SME notes' },
    ],
  },
  {
    sheet: RulebookSheet.DOMAINS,
    required: true,
    description:
      'Per-domain astrological methodology. Step 08 sections 12-13. A domain is NOT simply a house - fill these from your own methodology, not from generic assumptions.',
    columns: [
      { header: 'Domain', field: 'domain', required: true, description: 'One of the ZUNO domains, e.g. CAREER' },
      { header: 'Primary Houses', field: 'primary_houses', required: false, aliases: ['Primary House'], description: 'Comma separated, e.g. 10, 6, 11' },
      { header: 'Secondary Houses', field: 'secondary_houses', required: false, description: 'Comma separated' },
      { header: 'Primary Planets', field: 'primary_planets', required: false, description: 'Comma separated, e.g. SATURN, SUN' },
      { header: 'Supporting Planets', field: 'supporting_planets', required: false, description: 'Comma separated' },
      { header: 'Divisional Charts', field: 'relevant_divisional_charts', required: false, aliases: ['Relevant Divisional Charts'], description: 'Comma separated, e.g. D10, D9' },
      { header: 'Timing Factors', field: 'timing_factors', required: false, description: 'Comma separated, e.g. DASHA, BHUKTI, TRANSIT' },
      { header: 'Methodology Notes', field: 'methodology_notes', required: false, aliases: ['Notes'], description: 'Free text for the SME' },
    ],
  },
  {
    sheet: RulebookSheet.RULES,
    required: true,
    description:
      'The astrology rules themselves. Step 08 section 8 (rule anatomy). One row per rule.',
    columns: [
      { header: 'Rule ID', field: 'rule_id', required: true, aliases: ['RuleID', 'ID'], description: 'Permanent, never reused. e.g. ASTRO-CAREER-001' },
      { header: 'Rule Name', field: 'rule_name', required: true, aliases: ['Name'], description: 'Short descriptive name' },
      { header: 'Domain', field: 'domain', required: true, description: 'e.g. CAREER' },
      { header: 'Subcategory', field: 'subcategory', required: false, aliases: ['Sub Category'], description: 'e.g. JOB_SECURITY' },
      { header: 'Primary Factor', field: 'primary_factor', required: true, aliases: ['Primary Condition', 'Condition'], description: 'The main astrological condition, in your own words' },
      { header: 'Supporting Factors', field: 'supporting_factors', required: false, aliases: ['Supporting Condition'], description: 'Conditions that strengthen the rule. Separate with |' },
      { header: 'Counter Factors', field: 'counter_factors', required: false, aliases: ['Counter Condition'], description: 'Protective influences. Separate with |' },
      { header: 'Theme', field: 'theme', required: true, description: 'Controlled vocabulary, e.g. VOLATILITY' },
      { header: 'Direction', field: 'direction', required: true, description: 'SUPPORTIVE / CAUTION / NEUTRAL / MIXED' },
      { header: 'Strength', field: 'strength', required: true, description: 'LOW / MODERATE / HIGH / VERY_HIGH' },
      { header: 'Interpretation ID', field: 'interpretation_id', required: false, aliases: ['Interpretation'], description: 'Must exist in INTERPRETATIONS' },
      { header: 'Timing Rule IDs', field: 'timing_rule_ids', required: false, aliases: ['Timing Rules'], description: 'Comma separated; must exist in TIMING_RULES' },
      { header: 'Remedy IDs', field: 'remedy_ids', required: false, aliases: ['Remedies'], description: 'Comma separated; must exist in REMEDIES' },
      { header: 'Conflict Rule IDs', field: 'conflict_rule_ids', required: false, description: 'Comma separated' },
      { header: 'Safety Class', field: 'safety_class', required: true, description: 'STANDARD / LOW_RISK / REQUIRES_CAUTION / SME_SUPERVISION / EXCLUDE_PENDING_SPECIAL_REVIEW' },
      { header: 'Sensitive Subjects', field: 'sensitive_subjects', required: false, description: 'Comma separated, e.g. HEALTH, LEGAL_CONSEQUENCE' },
      { header: 'SME Confidence', field: 'sme_confidence', required: false, description: 'ESTABLISHED / STRONG / CONTEXT_DEPENDENT / EXPERIMENTAL' },
      { header: 'Status', field: 'status', required: true, description: 'DRAFT / UNDER_REVIEW / APPROVED / DISABLED / DEPRECATED' },
      { header: 'Version', field: 'version', required: false, aliases: ['Rule Version'], description: 'e.g. 1.0' },
      { header: 'SME Comment', field: 'sme_comment', required: false, aliases: ['Comment', 'Notes'], description: 'Internal only, never shown to users' },
      { header: 'Change Reason', field: 'change_reason', required: false, description: 'Why this rule changed' },
      { header: 'Effective From', field: 'effective_from', required: false, description: 'YYYY-MM-DD' },
      { header: 'Effective Until', field: 'effective_until', required: false, description: 'YYYY-MM-DD' },
    ],
  },
  {
    sheet: RulebookSheet.INTERPRETATIONS,
    required: true,
    description:
      'What each theme MEANS. Step 08 sections 24-28. This meaning is preserved exactly - ZUNO may reword for tone, never change the meaning, direction or severity.',
    columns: [
      { header: 'Interpretation ID', field: 'interpretation_id', required: true, aliases: ['ID'], description: 'e.g. INT-CAREER-001' },
      { header: 'Theme', field: 'theme', required: false, description: 'Theme this interprets' },
      { header: 'Meaning', field: 'meaning', required: true, description: 'The approved astrological meaning' },
      { header: 'Allowed Domains', field: 'allowed_domains', required: false, description: 'Comma separated. Prevents reuse in the wrong domain' },
      { header: 'User Safe Summary', field: 'user_safe_summary', required: false, description: 'Optional plainer phrasing approved for direct display' },
      { header: 'Status', field: 'status', required: false, description: 'DRAFT / APPROVED / ...' },
    ],
  },
  {
    sheet: RulebookSheet.TIMING_RULES,
    required: false,
    description:
      'Timing windows. Step 08 sections 29-33. A window is NOT an event prediction.',
    columns: [
      { header: 'Timing Rule ID', field: 'timing_rule_id', required: true, aliases: ['ID'], description: 'e.g. TIME-CAREER-014' },
      { header: 'Domain', field: 'domain', required: false, description: 'e.g. CAREER' },
      { header: 'Window Type', field: 'window_type', required: true, description: 'PREPARATION / CAUTION / TRANSITION / REVIEW / SUPPORT / STABILISATION / GROWTH' },
      { header: 'Strength', field: 'strength', required: true, description: 'LOW / MODERATE / HIGH / VERY_HIGH' },
      { header: 'Conditions', field: 'conditions', required: true, description: 'How the window is derived, e.g. Mahadasha + Bhukti combination' },
      { header: 'Timing Language', field: 'timing_language', required: false, description: 'Approved wording for describing this window' },
      { header: 'Status', field: 'status', required: false, description: 'DRAFT / APPROVED / ...' },
    ],
  },
  {
    sheet: RulebookSheet.REMEDIES,
    required: false,
    description:
      'Approved remedies. Step 08 sections 39-59. ZUNO will never invent one - if it is not here, it is never suggested.',
    columns: [
      { header: 'Remedy ID', field: 'remedy_id', required: true, aliases: ['ID'], description: 'e.g. REM-MANTRA-001' },
      { header: 'Name', field: 'name', required: true, description: 'Remedy name' },
      { header: 'Type', field: 'remedy_type', required: true, aliases: ['Remedy Type'], description: 'MANTRA / MEDITATION / DISCIPLINE / SERVICE / CHARITY / DEVOTIONAL / RITUAL / BEHAVIOURAL / LIFESTYLE' },
      { header: 'MKA Dimension', field: 'mka_dimension', required: true, aliases: ['MKA'], description: 'MIND / KARMA / ACTION' },
      { header: 'Purpose', field: 'purpose', required: true, description: 'What this remedy is for' },
      { header: 'Astrological Basis', field: 'astrological_basis', required: false, description: 'Why it applies. Internal.' },
      { header: 'Instructions', field: 'instructions', required: true, description: 'Exact instructions. Mantras are preserved character for character and never reworded.' },
      { header: 'Frequency', field: 'frequency', required: true, description: 'ONE_TIME / DAILY / WEEKLY / MONTHLY / OCCASIONAL' },
      { header: 'Duration', field: 'duration', required: false, description: 'e.g. 40 days' },
      { header: 'Preferred Time', field: 'preferred_time', required: false, description: 'e.g. sunrise' },
      { header: 'Restrictions', field: 'restrictions', required: false, description: 'Who should not do this' },
      { header: 'Conflicts With', field: 'conflicts_with', required: false, description: 'Comma separated remedy IDs' },
      { header: 'Safety Class', field: 'safety_class', required: false, description: 'LOW_RISK / REQUIRES_CAUTION / SME_SUPERVISION' },
      { header: 'Has Financial Cost', field: 'has_financial_cost', required: false, description: 'YES / NO. ZUNO avoids remedies that create financial burden.' },
      { header: 'Is Devotional', field: 'is_devotional', required: false, description: 'YES / NO. Lets users choose practical-only guidance.' },
      { header: 'Alternatives', field: 'alternative_keys', required: false, description: 'Comma separated remedy IDs' },
      { header: 'User Explanation', field: 'user_explanation', required: false, description: 'Plain-language reason the user can be shown' },
      { header: 'Status', field: 'status', required: false, description: 'DRAFT / APPROVED / ...' },
    ],
  },
  {
    sheet: RulebookSheet.CONFLICT_RULES,
    required: false,
    description:
      'How to resolve rules that disagree. Step 10 section 16. ZUNO will never invent a precedence hierarchy - if two rules conflict and no row here covers it, it falls back safely and flags it for you.',
    columns: [
      { header: 'Conflict ID', field: 'conflict_id', required: true, aliases: ['ID'], description: 'e.g. CONF-001' },
      { header: 'Rule IDs', field: 'rule_ids', required: true, description: 'Comma separated rules that can conflict' },
      { header: 'Resolution Strategy', field: 'resolution_strategy', required: true, description: 'e.g. DASHA_PRECEDENCE, HOUSE_HIERARCHY, PRESERVE_BOTH' },
      { header: 'Winning Rule ID', field: 'winning_rule_id', required: false, description: 'When one rule takes precedence' },
      { header: 'Rationale', field: 'rationale', required: false, description: 'Why' },
    ],
  },
  {
    sheet: RulebookSheet.GOLDEN_CASES,
    required: false,
    description:
      'Regression test cases. Step 08 sections 70-72. Use SYNTHETIC birth data only - never a real person.',
    columns: [
      { header: 'Case ID', field: 'case_id', required: true, aliases: ['ID'], description: 'e.g. GOLD-CAREER-001' },
      { header: 'Case Name', field: 'case_name', required: true, aliases: ['Name'], description: 'Short description' },
      { header: 'Domain', field: 'domain', required: false, description: 'e.g. CAREER' },
      { header: 'Date Of Birth', field: 'date_of_birth', required: true, aliases: ['DOB'], description: 'YYYY-MM-DD (synthetic)' },
      { header: 'Time Of Birth', field: 'time_of_birth', required: false, aliases: ['TOB'], description: 'HH:mm' },
      { header: 'Place Of Birth', field: 'place_of_birth', required: false, aliases: ['Place'], description: 'Place name' },
      { header: 'Challenge', field: 'challenge_statement', required: true, aliases: ['Challenge Statement'], description: 'What the person would say' },
      { header: 'Expected Rule IDs', field: 'expected_rule_ids', required: false, description: 'Comma separated rules you expect to fire' },
      { header: 'Expected Themes', field: 'expected_themes', required: false, description: 'Comma separated' },
      { header: 'Expected Outcome Notes', field: 'expected_outcome_notes', required: false, aliases: ['Notes'], description: 'What good output looks like' },
    ],
  },
];

export function sheetSpec(sheet: RulebookSheet): SheetSpec | undefined {
  return RULEBOOK_WORKBOOK_SCHEMA.find((s) => s.sheet === sheet);
}

/** Normalises a header for tolerant matching: lowercase, collapsed spaces. */
export function normaliseHeader(header: string): string {
  return String(header ?? '')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .toLowerCase();
}
