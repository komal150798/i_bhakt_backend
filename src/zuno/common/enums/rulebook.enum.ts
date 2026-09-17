/**
 * SME Rulebook contract enums.
 *
 * Sources: Step 08 Astrology SME Rulebook Specification,
 * Step 10 Knowledge & Rulebook Management Specification,
 * Step 20 Data Model sections 65-73.
 *
 * The governing directive is Step 10 section 47:
 *
 *   "Do not hard-code astrological rules into source code or LLM system
 *    prompts. Implement astrology knowledge as an independently versioned,
 *    externally managed knowledge layer."
 *
 * Nothing in this file encodes astrological *meaning*. These are the
 * structural vocabularies a rule is expressed in; the rules themselves come
 * from the SME's workbook.
 */

/**
 * Rulebook version lifecycle. Step 10 section 5.
 *
 * SPEC_CONFLICT resolved and recorded in ZUNO_DECISION_LOG.md item 12:
 * Step 20 section 66 lists a shorter lifecycle (UPLOADED / VALIDATING /
 * PENDING_SME_REVIEW / SME_APPROVED / READY_FOR_ACTIVATION / ACTIVE / ...)
 * while Step 10 section 5 adds STAGING and REGRESSION_PASSED.
 *
 * Master Index section 27 puts the engine-specific specification above the
 * data contract, so Step 10's fuller lifecycle wins - and it is the safer of
 * the two, because it forces a candidate through staging and Golden Case
 * regression before it can reach production.
 */
export enum RulebookStatus {
  UPLOADED = 'UPLOADED',
  VALIDATING = 'VALIDATING',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATED = 'VALIDATED',
  SME_REVIEW_IN_PROGRESS = 'SME_REVIEW_IN_PROGRESS',
  SME_REVIEWED = 'SME_REVIEWED',
  SME_REJECTED = 'SME_REJECTED',
  STAGING = 'STAGING',
  REGRESSION_RUNNING = 'REGRESSION_RUNNING',
  REGRESSION_PASSED = 'REGRESSION_PASSED',
  REGRESSION_FAILED = 'REGRESSION_FAILED',
  APPROVED = 'APPROVED',
  PRODUCTION = 'PRODUCTION',
  SUPERSEDED = 'SUPERSEDED',
  ROLLED_BACK = 'ROLLED_BACK',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Legal lifecycle transitions.
 *
 * Step 10 section 47, second directive: "Never allow an uploaded Rulebook to
 * become active solely because it passed technical validation." That is
 * enforced structurally here - there is no edge from VALIDATED to PRODUCTION.
 * The only path runs through SME review, staging, regression and approval.
 */
export const RULEBOOK_STATUS_TRANSITIONS: Readonly<
  Record<RulebookStatus, readonly RulebookStatus[]>
> = {
  [RulebookStatus.UPLOADED]: [RulebookStatus.VALIDATING, RulebookStatus.ARCHIVED],
  [RulebookStatus.VALIDATING]: [
    RulebookStatus.VALIDATED,
    RulebookStatus.VALIDATION_FAILED,
  ],
  [RulebookStatus.VALIDATION_FAILED]: [
    RulebookStatus.VALIDATING,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.VALIDATED]: [
    RulebookStatus.SME_REVIEW_IN_PROGRESS,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.SME_REVIEW_IN_PROGRESS]: [
    RulebookStatus.SME_REVIEWED,
    RulebookStatus.SME_REJECTED,
  ],
  [RulebookStatus.SME_REJECTED]: [
    RulebookStatus.SME_REVIEW_IN_PROGRESS,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.SME_REVIEWED]: [RulebookStatus.STAGING, RulebookStatus.ARCHIVED],
  [RulebookStatus.STAGING]: [
    RulebookStatus.REGRESSION_RUNNING,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.REGRESSION_RUNNING]: [
    RulebookStatus.REGRESSION_PASSED,
    RulebookStatus.REGRESSION_FAILED,
  ],
  [RulebookStatus.REGRESSION_FAILED]: [
    RulebookStatus.STAGING,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.REGRESSION_PASSED]: [
    RulebookStatus.APPROVED,
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.APPROVED]: [RulebookStatus.PRODUCTION, RulebookStatus.ARCHIVED],
  // Step 10 section 26: the outgoing production version becomes SUPERSEDED,
  // and section 28 allows a rollback. Neither deletes anything.
  [RulebookStatus.PRODUCTION]: [
    RulebookStatus.SUPERSEDED,
    RulebookStatus.ROLLED_BACK,
  ],
  [RulebookStatus.SUPERSEDED]: [
    RulebookStatus.PRODUCTION, // reactivated by a rollback
    RulebookStatus.ARCHIVED,
  ],
  [RulebookStatus.ROLLED_BACK]: [RulebookStatus.ARCHIVED],
  [RulebookStatus.ARCHIVED]: [],
};

export function canTransitionRulebook(
  from: RulebookStatus,
  to: RulebookStatus,
): boolean {
  return (RULEBOOK_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/** Step 10 section 4: semantic version, and what each bump means. */
export enum RulebookReleaseType {
  /** Wording, metadata, typos - nothing that changes behaviour. */
  PATCH = 'PATCH',
  /** New rules, remedies, interpretations, timing logic, golden cases. */
  MINOR = 'MINOR',
  /** Methodology or schema change. Incompatible by definition. */
  MAJOR = 'MAJOR',
}

/** Step 08 section 61. Only APPROVED rules execute in production. */
export enum RuleStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  DISABLED = 'DISABLED',
  DEPRECATED = 'DEPRECATED',
}

/** Step 08 section 68. Only established categories are production eligible. */
export enum SmeConfidence {
  ESTABLISHED = 'ESTABLISHED',
  STRONG = 'STRONG',
  CONTEXT_DEPENDENT = 'CONTEXT_DEPENDENT',
  /** Step 08 section 69: must never silently influence user guidance. */
  EXPERIMENTAL = 'EXPERIMENTAL',
}

/**
 * Rule condition types. Step 08 section 14, Step 07 section 45.
 *
 * These describe the *shape* of an astrological condition, not its meaning.
 * "Mercury is retrograde" is a PLANET_RETROGRADE condition; whether that
 * matters, and what it implies, is entirely the SME's call.
 */
export enum RuleConditionType {
  PLANET_IN_HOUSE = 'PLANET_IN_HOUSE',
  PLANET_IN_SIGN = 'PLANET_IN_SIGN',
  HOUSE_LORD_IN_HOUSE = 'HOUSE_LORD_IN_HOUSE',
  HOUSE_LORD_RELATIONSHIP = 'HOUSE_LORD_RELATIONSHIP',
  PLANET_ASPECT = 'PLANET_ASPECT',
  PLANET_CONJUNCTION = 'PLANET_CONJUNCTION',
  PLANET_RETROGRADE = 'PLANET_RETROGRADE',
  PLANET_COMBUST = 'PLANET_COMBUST',
  DASHA_LORD = 'DASHA_LORD',
  BHUKTI_LORD = 'BHUKTI_LORD',
  ANTARA_LORD = 'ANTARA_LORD',
  TRANSIT_IN_HOUSE = 'TRANSIT_IN_HOUSE',
  TRANSIT_ASPECT = 'TRANSIT_ASPECT',
  NAKSHATRA = 'NAKSHATRA',
  DIVISIONAL_POSITION = 'DIVISIONAL_POSITION',
  MULTIPLE_CONDITION = 'MULTIPLE_CONDITION',
}

/** Step 08 section 16: composite rules need boolean combination. */
export enum RuleConditionOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

/** What a condition contributes. Step 08 sections 17-18. */
export enum RuleFactorRole {
  PRIMARY = 'PRIMARY',
  /** Strengthens the primary condition (section 17). */
  SUPPORTING = 'SUPPORTING',
  /**
   * A protective influence that must be preserved, not cancelled out
   * (section 18). 8th-house pressure alongside 11th-house support produces
   * "VOLATILITY high AND RECOVERY_SUPPORT high", never "CAREER = BAD".
   */
  COUNTER = 'COUNTER',
}

/**
 * Controlled theme vocabulary. Step 08 section 19.
 *
 * Step 08 section 20 forbids fatalistic internal labels - no DISASTER, DOOM,
 * BAD_LUCK, JOB_LOSS, DIVORCE or FAILURE. The system models *conditions*, not
 * verdicts, and a label like JOB_LOSS would leak determinism into every layer
 * above it.
 *
 * SMEs may propose additions; validation rejects anything not listed here so a
 * workbook cannot quietly introduce a fatalistic theme.
 */
export enum RuleTheme {
  VOLATILITY = 'VOLATILITY',
  DELAY = 'DELAY',
  RENEGOTIATION = 'RENEGOTIATION',
  TRANSITION = 'TRANSITION',
  PRESSURE = 'PRESSURE',
  RECOVERY_SUPPORT = 'RECOVERY_SUPPORT',
  NETWORK_SUPPORT = 'NETWORK_SUPPORT',
  FINANCIAL_PRESSURE = 'FINANCIAL_PRESSURE',
  OPPORTUNITY = 'OPPORTUNITY',
  STABILITY = 'STABILITY',
  GROWTH = 'GROWTH',
  REASSESSMENT = 'REASSESSMENT',
  CAUTION = 'CAUTION',
  PREPARATION = 'PREPARATION',
}

/** Step 08 section 21 / Step 07 section 56. Never "good planet / bad planet". */
export enum ThemeDirection {
  SUPPORTIVE = 'SUPPORTIVE',
  CAUTION = 'CAUTION',
  NEUTRAL = 'NEUTRAL',
  MIXED = 'MIXED',
}

/**
 * Step 08 section 22 / Step 07 section 55.
 *
 * Deliberately an enum rather than a number: section 23 forbids fake precision
 * such as "78% layoff probability" unless a validated statistical model exists.
 * There is no such model, so the type system refuses to represent one.
 */
export enum ThemeStrength {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

/** Step 07 section 60 / Step 08 section 31. Timing is not event prediction. */
export enum TimingWindowType {
  PREPARATION = 'PREPARATION',
  CAUTION = 'CAUTION',
  TRANSITION = 'TRANSITION',
  REVIEW = 'REVIEW',
  SUPPORT = 'SUPPORT',
  STABILISATION = 'STABILISATION',
  GROWTH = 'GROWTH',
}

/** Step 08 section 42. Final taxonomy is SME-approved. */
export enum RemedyType {
  MANTRA = 'MANTRA',
  MEDITATION = 'MEDITATION',
  DISCIPLINE = 'DISCIPLINE',
  SERVICE = 'SERVICE',
  CHARITY = 'CHARITY',
  DEVOTIONAL = 'DEVOTIONAL',
  RITUAL = 'RITUAL',
  BEHAVIOURAL = 'BEHAVIOURAL',
  LIFESTYLE = 'LIFESTYLE',
}

/**
 * Step 08 section 43: approved remedies map into Mind / Karma / Action.
 * Note section 43's caveat - ACTION is primarily practical, not astrological.
 */
export enum MkaDimension {
  MIND = 'MIND',
  KARMA = 'KARMA',
  ACTION = 'ACTION',
}

/** Step 08 sections 46-47. */
export enum RemedyFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  OCCASIONAL = 'OCCASIONAL',
}

/**
 * Step 08 section 51 and Step 10 section 17.
 *
 * EXCLUDE_PENDING_SPECIAL_REVIEW is the important one: Step 10 section 17 says
 * such rules "must never enter normal production reasoning", so the runtime
 * repository filters them out even inside an approved, active rulebook.
 */
export enum RuleSafetyClass {
  STANDARD = 'STANDARD',
  LOW_RISK = 'LOW_RISK',
  REQUIRES_CAUTION = 'REQUIRES_CAUTION',
  SME_SUPERVISION = 'SME_SUPERVISION',
  EXCLUDE_PENDING_SPECIAL_REVIEW = 'EXCLUDE_PENDING_SPECIAL_REVIEW',
}

/**
 * Safety classes that may never be used to generate user-facing guidance,
 * regardless of rulebook status. Enforced in RulebookRepositoryService.
 */
export const NON_PRODUCTION_SAFETY_CLASSES: readonly RuleSafetyClass[] = [
  RuleSafetyClass.EXCLUDE_PENDING_SPECIAL_REVIEW,
  RuleSafetyClass.SME_SUPERVISION,
];

/**
 * Subject areas requiring enhanced governance. Step 10 section 17.
 *
 * A rule touching any of these needs an explicit safety class and two-person
 * review (Step 08 section 62) before it can go to production.
 */
export enum SensitiveSubject {
  HEALTH = 'HEALTH',
  DISEASE = 'DISEASE',
  DEATH = 'DEATH',
  LONGEVITY = 'LONGEVITY',
  MISSING_PERSON = 'MISSING_PERSON',
  PREGNANCY = 'PREGNANCY',
  CHILD_GENDER = 'CHILD_GENDER',
  LEGAL_CONSEQUENCE = 'LEGAL_CONSEQUENCE',
  FINANCIAL_LOSS = 'FINANCIAL_LOSS',
}

/** SME review outcome per rule. Step 20 section 72. */
export enum RuleReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION',
  POSSIBLE_DUPLICATE = 'POSSIBLE_DUPLICATE',
}

/** Step 10 section 37: minimum audit event types. */
export enum RulebookAuditAction {
  RULEBOOK_UPLOADED = 'RULEBOOK_UPLOADED',
  VALIDATION_STARTED = 'VALIDATION_STARTED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',
  SME_REVIEW_STARTED = 'SME_REVIEW_STARTED',
  SME_APPROVED = 'SME_APPROVED',
  SME_REJECTED = 'SME_REJECTED',
  STAGING_ACTIVATED = 'STAGING_ACTIVATED',
  REGRESSION_STARTED = 'REGRESSION_STARTED',
  REGRESSION_PASSED = 'REGRESSION_PASSED',
  REGRESSION_FAILED = 'REGRESSION_FAILED',
  PRODUCTION_ACTIVATED = 'PRODUCTION_ACTIVATED',
  ROLLBACK_INITIATED = 'ROLLBACK_INITIATED',
  ROLLBACK_COMPLETED = 'ROLLBACK_COMPLETED',
  RULEBOOK_ARCHIVED = 'RULEBOOK_ARCHIVED',
}

/**
 * Validation finding severity.
 * ERROR blocks the lifecycle; WARNING is surfaced to the SME for a decision.
 */
export enum ValidationSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

/** Step 10 section 11: mandatory worksheet names in the uploaded workbook. */
export enum RulebookSheet {
  CONFIGURATION = 'CONFIGURATION',
  DOMAINS = 'DOMAINS',
  RULES = 'RULES',
  INTERPRETATIONS = 'INTERPRETATIONS',
  TIMING_RULES = 'TIMING_RULES',
  REMEDIES = 'REMEDIES',
  REMEDY_MAPPING = 'REMEDY_MAPPING',
  CONFLICT_RULES = 'CONFLICT_RULES',
  GOLDEN_CASES = 'GOLDEN_CASES',
}

/**
 * Sheets without which the workbook cannot be processed at all.
 *
 * Step 10 section 11 says "missing mandatory structures cause
 * VALIDATION_FAILED". The others are optional in early rulebook versions - an
 * SME can ship a first rulebook with rules and interpretations and add timing,
 * remedies and conflicts later.
 */
export const REQUIRED_RULEBOOK_SHEETS: readonly RulebookSheet[] = [
  RulebookSheet.DOMAINS,
  RulebookSheet.RULES,
  RulebookSheet.INTERPRETATIONS,
];

/** Roles that govern the rulebook lifecycle. Step 10 sections 25 and 38. */
export enum RulebookRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  ASTROLOGY_SME = 'ASTROLOGY_SME',
  PRODUCT_ADMIN = 'PRODUCT_ADMIN',
  SUPPORT = 'SUPPORT',
}

/**
 * Discrete permissions. Step 21 section 107 requires explicit, auditable admin
 * permissions and separation of duties.
 *
 * Step 10 section 25: "A single person should not normally have unrestricted
 * end-to-end control" - which is why SME_APPROVE and PRODUCTION_ACTIVATE are
 * separate permissions held by different roles.
 */
export enum RulebookPermission {
  RULEBOOK_UPLOAD = 'RULEBOOK_UPLOAD',
  RULEBOOK_VALIDATE = 'RULEBOOK_VALIDATE',
  RULEBOOK_REVIEW = 'RULEBOOK_REVIEW',
  RULEBOOK_APPROVE = 'RULEBOOK_APPROVE',
  RULEBOOK_STAGE = 'RULEBOOK_STAGE',
  RULEBOOK_ACTIVATE = 'RULEBOOK_ACTIVATE',
  RULEBOOK_ROLLBACK = 'RULEBOOK_ROLLBACK',
  RULEBOOK_VIEW = 'RULEBOOK_VIEW',
}

/** Step 10 section 38: what each role may do. */
export const RULEBOOK_ROLE_PERMISSIONS: Readonly<
  Record<RulebookRole, readonly RulebookPermission[]>
> = {
  [RulebookRole.SYSTEM_ADMIN]: [
    RulebookPermission.RULEBOOK_UPLOAD,
    RulebookPermission.RULEBOOK_VALIDATE,
    RulebookPermission.RULEBOOK_STAGE,
    RulebookPermission.RULEBOOK_ACTIVATE,
    RulebookPermission.RULEBOOK_ROLLBACK,
    RulebookPermission.RULEBOOK_VIEW,
    // Deliberately NOT RULEBOOK_APPROVE - astrological approval is the SME's,
    // and letting an admin self-approve would collapse the separation of
    // duties Step 10 section 25 requires.
  ],
  [RulebookRole.ASTROLOGY_SME]: [
    RulebookPermission.RULEBOOK_REVIEW,
    RulebookPermission.RULEBOOK_APPROVE,
    RulebookPermission.RULEBOOK_VIEW,
  ],
  [RulebookRole.PRODUCT_ADMIN]: [
    RulebookPermission.RULEBOOK_VIEW,
    RulebookPermission.RULEBOOK_ACTIVATE,
  ],
  [RulebookRole.SUPPORT]: [RulebookPermission.RULEBOOK_VIEW],
};
