import { ZunoRiskClass } from './domain.enum';

export { ZunoRiskClass };

/**
 * Safety dispositions. Step 19 Safety & Trust section 18,
 * matching the wire contract in Step 21 API Contracts section 68.
 */
export enum SafetyDisposition {
  ALLOW = 'ALLOW',
  ALLOW_WITH_BOUNDARY = 'ALLOW_WITH_BOUNDARY',
  PROFESSIONAL_SUPPORT_RECOMMENDED = 'PROFESSIONAL_SUPPORT_RECOMMENDED',
  PROFESSIONAL_SUPPORT_REQUIRED = 'PROFESSIONAL_SUPPORT_REQUIRED',
  RESTRICT = 'RESTRICT',
  CRITICAL_ESCALATION = 'CRITICAL_ESCALATION',
}

/**
 * Ordering used to merge several safety signals. Merging always takes the
 * MOST restrictive disposition - Step 19 section 3: safety is above astrology,
 * and section 56: low confidence in a high-stakes context increases caution.
 */
export const SAFETY_DISPOSITION_SEVERITY: Readonly<Record<SafetyDisposition, number>> = {
  [SafetyDisposition.ALLOW]: 0,
  [SafetyDisposition.ALLOW_WITH_BOUNDARY]: 1,
  [SafetyDisposition.PROFESSIONAL_SUPPORT_RECOMMENDED]: 2,
  [SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED]: 3,
  [SafetyDisposition.RESTRICT]: 4,
  [SafetyDisposition.CRITICAL_ESCALATION]: 5,
};

export const RISK_CLASS_SEVERITY: Readonly<Record<ZunoRiskClass, number>> = {
  [ZunoRiskClass.LOW_RISK]: 0,
  [ZunoRiskClass.MODERATE_RISK]: 1,
  [ZunoRiskClass.HIGH_STAKES]: 2,
  [ZunoRiskClass.CRITICAL_SAFETY]: 3,
};

/** Step 11 section 27: high-risk signals routed straight to Safety & Trust. */
export enum SafetyFlag {
  SELF_HARM = 'SELF_HARM',
  HARM_TO_OTHERS = 'HARM_TO_OTHERS',
  IMMEDIATE_MEDICAL_RISK = 'IMMEDIATE_MEDICAL_RISK',
  VIOLENCE = 'VIOLENCE',
  ABUSE = 'ABUSE',
  CHILD_SAFETY = 'CHILD_SAFETY',
  CRIMINAL_REQUEST = 'CRIMINAL_REQUEST',
  SERIOUS_LEGAL_RISK = 'SERIOUS_LEGAL_RISK',
  SEVERE_FINANCIAL_RISK = 'SEVERE_FINANCIAL_RISK',
}

/**
 * Flags that override the entire normal ZUNO response flow
 * (Step 19 section 16). These can never be downgraded by any other signal.
 */
export const CRITICAL_SAFETY_FLAGS: readonly SafetyFlag[] = [
  SafetyFlag.SELF_HARM,
  SafetyFlag.HARM_TO_OTHERS,
  SafetyFlag.IMMEDIATE_MEDICAL_RISK,
  SafetyFlag.VIOLENCE,
  SafetyFlag.ABUSE,
  SafetyFlag.CHILD_SAFETY,
];

/** Step 19 section 17: actions attached to a safety decision. */
export enum SafetyAction {
  ALLOW_GENERAL_GUIDANCE = 'ALLOW_GENERAL_GUIDANCE',
  REQUIRE_PROFESSIONAL_BOUNDARY = 'REQUIRE_PROFESSIONAL_BOUNDARY',
  SUPPRESS_ASTROLOGY = 'SUPPRESS_ASTROLOGY',
  REDUCE_RESPONSE_DEPTH = 'REDUCE_RESPONSE_DEPTH',
  ESCALATE_CRITICAL = 'ESCALATE_CRITICAL',
  BLOCK_RESPONSE = 'BLOCK_RESPONSE',
}

/** Step 19 section 17: capabilities a safety decision can switch off. */
export enum SafetyBlockedCapability {
  GUARANTEED_LEGAL_OUTCOME = 'GUARANTEED_LEGAL_OUTCOME',
  GUARANTEED_MEDICAL_OUTCOME = 'GUARANTEED_MEDICAL_OUTCOME',
  GUARANTEED_FINANCIAL_OUTCOME = 'GUARANTEED_FINANCIAL_OUTCOME',
  DETERMINISTIC_PREDICTION = 'DETERMINISTIC_PREDICTION',
  ASTROLOGY_REMEDY = 'ASTROLOGY_REMEDY',
  COMMERCIAL_UPSELL = 'COMMERCIAL_UPSELL',
}

/** Step 19 section 51: post-check violation categories. */
export enum SafetyViolation {
  UNSUPPORTED_CERTAINTY = 'UNSUPPORTED_CERTAINTY',
  FEAR_AMPLIFICATION = 'FEAR_AMPLIFICATION',
  HARMFUL_ADVICE = 'HARMFUL_ADVICE',
  UNSAFE_REMEDY = 'UNSAFE_REMEDY',
  PROFESSIONAL_BOUNDARY_VIOLATION = 'PROFESSIONAL_BOUNDARY_VIOLATION',
  PRIVACY_LEAKAGE = 'PRIVACY_LEAKAGE',
  HYPOTHETICAL_CONTAMINATION = 'HYPOTHETICAL_CONTAMINATION',
  CONTRADICTS_KNOWN_FACTS = 'CONTRADICTS_KNOWN_FACTS',
  FATALISM = 'FATALISM',
}

/** The safety policy version stamped onto decisions (Step 19 section 53). */
export const ZUNO_SAFETY_POLICY_VERSION = '1.0';
