import {
  SafetyAction,
  SafetyBlockedCapability,
  SafetyDisposition,
  SafetyFlag,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

/**
 * A deterministic safety rule. Step 19 Safety & Trust section 54.
 *
 * Step 19 section 52 is explicit: "safety logic should be configuration/version
 * driven - do not bury all safety rules inside one LLM prompt". These rules are
 * therefore plain data, evaluated by code. An LLM may *detect* a signal
 * (section 55) but what ZUNO is then allowed to do is decided here.
 */
export interface SafetyRule {
  rule_id: string;
  /** Domain the rule applies to, or null for any domain. */
  domain: ZunoDomain | null;
  /** Flag that triggers the rule, or null if the rule is domain-driven. */
  flag: SafetyFlag | null;
  risk_level: ZunoRiskClass;
  disposition: SafetyDisposition;
  required_actions: SafetyAction[];
  blocked_capabilities: SafetyBlockedCapability[];
  /** Non-clinical, non-directive wording for the boundary shown to the user. */
  boundary_message?: string;
  suggested_support?: string;
  status: 'ACTIVE' | 'RETIRED';
  version: string;
}

/**
 * ZUNO safety policy v1.0.
 *
 * Derived from Step 19 sections 19-28 (per-domain boundaries) and sections
 * 13-16 (risk classes). Every user-facing string here follows Step 19's tone
 * constraints: no false certainty (section 7), no fear amplification
 * (section 9), no fatalism (section 10), and user agency preserved
 * (section 11).
 *
 * SPEC_GAP recorded in ZUNO_DECISION_LOG.md: Step 19 section 16 defers critical
 * escalation to "the platform's current approved safety policy and
 * jurisdiction-appropriate escalation mechanisms", which has not been supplied.
 * The CRITICAL rules below therefore stop generation and record an incident,
 * but deliberately contain no helpline numbers or jurisdiction routing - those
 * must come from an approved source, not be invented here (Build Rule 70:
 * "do not improvise high-risk behaviour").
 */
export const ZUNO_SAFETY_RULES: readonly SafetyRule[] = [
  // --- Critical safety. Overrides every other flow (section 16). ---
  {
    rule_id: 'SAFE-CRIT-001',
    domain: null,
    flag: SafetyFlag.SELF_HARM,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [
      SafetyAction.ESCALATE_CRITICAL,
      SafetyAction.SUPPRESS_ASTROLOGY,
      SafetyAction.BLOCK_RESPONSE,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.ASTROLOGY_REMEDY,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
      SafetyBlockedCapability.COMMERCIAL_UPSELL,
    ],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIT-002',
    domain: null,
    flag: SafetyFlag.HARM_TO_OTHERS,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [SafetyAction.ESCALATE_CRITICAL, SafetyAction.BLOCK_RESPONSE],
    blocked_capabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIT-003',
    domain: null,
    flag: SafetyFlag.IMMEDIATE_MEDICAL_RISK,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [
      SafetyAction.ESCALATE_CRITICAL,
      SafetyAction.SUPPRESS_ASTROLOGY,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_MEDICAL_OUTCOME,
      SafetyBlockedCapability.ASTROLOGY_REMEDY,
    ],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIT-004',
    domain: null,
    flag: SafetyFlag.ABUSE,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [
      SafetyAction.ESCALATE_CRITICAL,
      SafetyAction.SUPPRESS_ASTROLOGY,
    ],
    blocked_capabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIT-005',
    domain: null,
    flag: SafetyFlag.CHILD_SAFETY,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [SafetyAction.ESCALATE_CRITICAL, SafetyAction.BLOCK_RESPONSE],
    blocked_capabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIT-006',
    domain: null,
    flag: SafetyFlag.VIOLENCE,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.CRITICAL_ESCALATION,
    required_actions: [
      SafetyAction.ESCALATE_CRITICAL,
      SafetyAction.SUPPRESS_ASTROLOGY,
    ],
    blocked_capabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
    status: 'ACTIVE',
    version: '1.0',
  },

  // --- High-stakes domains (section 15). Guide, but route to professionals. ---
  {
    rule_id: 'SAFE-LEG-001',
    domain: ZunoDomain.LEGAL,
    flag: null,
    risk_level: ZunoRiskClass.HIGH_STAKES,
    disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
    required_actions: [
      SafetyAction.ALLOW_GENERAL_GUIDANCE,
      SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    boundary_message:
      'I can help you get clear on your options and the questions worth asking, but I should not state the legal outcome as settled.',
    suggested_support: 'a qualified legal professional',
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-IMM-001',
    domain: ZunoDomain.FOREIGN_RESIDENCE,
    flag: null,
    risk_level: ZunoRiskClass.HIGH_STAKES,
    disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
    required_actions: [
      SafetyAction.ALLOW_GENERAL_GUIDANCE,
      SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    boundary_message:
      'Residency rules change and depend on current local requirements, so I can help you prepare, but I should not present the outcome as certain.',
    suggested_support: 'an immigration adviser familiar with your current rules',
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-MED-001',
    domain: ZunoDomain.HEALTH_WELLBEING,
    flag: null,
    risk_level: ZunoRiskClass.HIGH_STAKES,
    disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
    required_actions: [
      SafetyAction.ALLOW_GENERAL_GUIDANCE,
      SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
      SafetyAction.SUPPRESS_ASTROLOGY,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_MEDICAL_OUTCOME,
      SafetyBlockedCapability.ASTROLOGY_REMEDY,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    boundary_message:
      'I can help you think this through and prepare what to ask, but anything medical belongs with someone qualified to assess you properly.',
    suggested_support: 'a qualified medical professional',
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-FIN-001',
    domain: ZunoDomain.FINANCE,
    flag: SafetyFlag.SEVERE_FINANCIAL_RISK,
    risk_level: ZunoRiskClass.HIGH_STAKES,
    disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_RECOMMENDED,
    required_actions: [
      SafetyAction.ALLOW_GENERAL_GUIDANCE,
      SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
    ],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_FINANCIAL_OUTCOME,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    boundary_message:
      'We can work through your options and what to clarify, though a decision this size is worth checking with someone who can see your full position.',
    suggested_support: 'a qualified financial adviser',
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-LEG-002',
    domain: null,
    flag: SafetyFlag.SERIOUS_LEGAL_RISK,
    risk_level: ZunoRiskClass.HIGH_STAKES,
    disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
    required_actions: [
      SafetyAction.ALLOW_GENERAL_GUIDANCE,
      SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
    ],
    blocked_capabilities: [SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME],
    boundary_message:
      'There is a legal dimension here that I should not treat as settled.',
    suggested_support: 'a qualified legal professional',
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-CRIM-001',
    domain: null,
    flag: SafetyFlag.CRIMINAL_REQUEST,
    risk_level: ZunoRiskClass.CRITICAL_SAFETY,
    disposition: SafetyDisposition.RESTRICT,
    required_actions: [SafetyAction.BLOCK_RESPONSE],
    blocked_capabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
    boundary_message: 'That is not something I can help with.',
    status: 'ACTIVE',
    version: '1.0',
  },

  // --- Moderate-risk domains (section 14). Guide, preserving uncertainty. ---
  {
    rule_id: 'SAFE-CAR-001',
    domain: ZunoDomain.CAREER,
    flag: null,
    risk_level: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    required_actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blocked_capabilities: [SafetyBlockedCapability.DETERMINISTIC_PREDICTION],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-FIN-002',
    domain: ZunoDomain.FINANCE,
    flag: null,
    risk_level: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    required_actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_FINANCIAL_OUTCOME,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-REL-001',
    domain: ZunoDomain.RELATIONSHIP,
    flag: null,
    risk_level: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    required_actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blocked_capabilities: [SafetyBlockedCapability.DETERMINISTIC_PREDICTION],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-MAR-001',
    domain: ZunoDomain.MARRIAGE,
    flag: null,
    risk_level: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    required_actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blocked_capabilities: [SafetyBlockedCapability.DETERMINISTIC_PREDICTION],
    status: 'ACTIVE',
    version: '1.0',
  },
  {
    rule_id: 'SAFE-BUS-001',
    domain: ZunoDomain.BUSINESS,
    flag: null,
    risk_level: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    required_actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blocked_capabilities: [
      SafetyBlockedCapability.GUARANTEED_FINANCIAL_OUTCOME,
      SafetyBlockedCapability.DETERMINISTIC_PREDICTION,
    ],
    status: 'ACTIVE',
    version: '1.0',
  },
];

export function activeRules(): SafetyRule[] {
  return ZUNO_SAFETY_RULES.filter((rule) => rule.status === 'ACTIVE');
}
