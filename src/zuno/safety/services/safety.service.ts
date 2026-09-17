import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ZunoSafetyDecision } from '../entities/zuno-safety-decision.entity';
import { ZunoSafetyIncident } from '../entities/zuno-safety-incident.entity';
import { SafetySignalDetector } from './safety-signal-detector';
import { activeRules, SafetyRule } from './safety-policy';
import {
  CRITICAL_SAFETY_FLAGS,
  DOMAIN_BASELINE_RISK,
  RISK_CLASS_SEVERITY,
  SAFETY_DISPOSITION_SEVERITY,
  SafetyAction,
  SafetyBlockedCapability,
  SafetyDisposition,
  SafetyFlag,
  SafetyViolation,
  ZUNO_SAFETY_POLICY_VERSION,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

export interface SafetyPreCheckInput {
  operation: string;
  userId: string;
  challengeId?: string | null;
  text: string;
  /** Domains known so far. Empty on the very first pass. */
  domains?: ZunoDomain[];
  /**
   * Flags an LLM proposed. Step 19 section 55: the model may detect, but the
   * policy decides - these can only ever *add* to the deterministic result.
   */
  modelFlags?: SafetyFlag[];
}

export interface SafetyAssessment {
  riskLevel: ZunoRiskClass;
  disposition: SafetyDisposition;
  domains: ZunoDomain[];
  flags: SafetyFlag[];
  actions: SafetyAction[];
  blockedCapabilities: SafetyBlockedCapability[];
  matchedRuleIds: string[];
  boundaryMessage?: string;
  suggestedSupport?: string;
  policyVersion: string;
  /** True when generation must not proceed at all. */
  blocked: boolean;
  /** True when astrology-derived content must be suppressed. */
  astrologySuppressed: boolean;
}

export interface SafetyPostCheckInput {
  userId: string;
  challengeId?: string | null;
  safetyDecisionId?: string | null;
  responseId?: string | null;
  /** Candidate user-facing text, concatenated across sections. */
  candidateText: string;
  assessment: SafetyAssessment;
}

export interface SafetyPostCheckResult {
  allowed: boolean;
  rewriteRequired: boolean;
  violations: SafetyViolation[];
}

/**
 * The ZUNO safety gate.
 *
 * Two entry points matching Step 21 sections 68-69:
 *   preCheck()  - before orchestration, shapes the whole execution path
 *   postCheck() - before display, validates candidate output
 *
 * Step 19 section 3 gives this service precedence over astrology, engagement
 * and subscription logic, and Step 21 Rule 10 forbids any conversational
 * endpoint from bypassing it.
 */
@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(private readonly detector: SafetySignalDetector) {}

  /**
   * Classifies an inbound user statement and decides what ZUNO may do.
   *
   * Deterministic detection runs first and unconditionally. Model-supplied
   * flags are unioned in afterwards, never subtracted - a model cannot talk the
   * policy down from a signal the detector found.
   */
  preCheck(input: SafetyPreCheckInput): SafetyAssessment {
    const deterministicFlags = this.detector.detect(input.text);
    const flags = Array.from(
      new Set<SafetyFlag>([...deterministicFlags, ...(input.modelFlags ?? [])]),
    );
    const domains = input.domains ?? [];

    const matched = this.matchRules(flags, domains);

    // Baseline risk from the domains alone, so a domain with no explicit rule
    // still carries its inherent risk class rather than defaulting to LOW.
    const domainBaseline = domains.reduce<ZunoRiskClass>(
      (worst, domain) =>
        this.worseRisk(worst, DOMAIN_BASELINE_RISK[domain] ?? ZunoRiskClass.LOW_RISK),
      ZunoRiskClass.LOW_RISK,
    );

    const riskLevel = matched.reduce<ZunoRiskClass>(
      (worst, rule) => this.worseRisk(worst, rule.risk_level),
      domainBaseline,
    );

    const disposition = matched.reduce<SafetyDisposition>(
      (worst, rule) => this.worseDisposition(worst, rule.disposition),
      SafetyDisposition.ALLOW,
    );

    const actions = unique(matched.flatMap((rule) => rule.required_actions));
    const blockedCapabilities = unique(
      matched.flatMap((rule) => rule.blocked_capabilities),
    );

    // The most severe rule supplies the user-facing boundary wording, so a
    // challenge spanning FINANCE and FOREIGN_RESIDENCE shows the residency
    // boundary rather than whichever rule happened to be evaluated first.
    const leadRule = [...matched].sort(
      (a, b) =>
        SAFETY_DISPOSITION_SEVERITY[b.disposition] -
        SAFETY_DISPOSITION_SEVERITY[a.disposition],
    )[0];

    return {
      riskLevel,
      disposition,
      domains,
      flags,
      actions,
      blockedCapabilities,
      matchedRuleIds: matched.map((rule) => rule.rule_id),
      boundaryMessage: leadRule?.boundary_message,
      suggestedSupport: leadRule?.suggested_support,
      policyVersion: ZUNO_SAFETY_POLICY_VERSION,
      blocked:
        actions.includes(SafetyAction.BLOCK_RESPONSE) ||
        disposition === SafetyDisposition.CRITICAL_ESCALATION,
      astrologySuppressed:
        actions.includes(SafetyAction.SUPPRESS_ASTROLOGY) ||
        blockedCapabilities.includes(SafetyBlockedCapability.ASTROLOGY_REMEDY),
    };
  }

  /**
   * Re-runs the pre-check once domains are known.
   *
   * The first pass happens before classification, when `domains` is empty, so
   * domain-driven rules cannot have fired yet. Calling this after the WhatNow
   * engine returns is what brings SAFE-IMM-001 and friends into play. Flags
   * already found are carried forward so nothing is lost between passes.
   */
  refineWithDomains(
    previous: SafetyAssessment,
    input: Omit<SafetyPreCheckInput, 'modelFlags'> & { modelFlags?: SafetyFlag[] },
  ): SafetyAssessment {
    return this.preCheck({
      ...input,
      modelFlags: unique([...(previous.flags ?? []), ...(input.modelFlags ?? [])]),
    });
  }

  /**
   * Validates candidate output before it reaches the user.
   * Step 19 section 51, Step 21 section 69.
   *
   * These are deterministic linguistic checks, deliberately independent of the
   * model that produced the text: Step 21 section 69 requires that "critical
   * deterministic safety rules should also exist outside AI-only
   * classification". A model asked to grade its own output is not a control.
   */
  postCheck(input: SafetyPostCheckInput): SafetyPostCheckResult {
    const text = (input.candidateText ?? '').toLowerCase();
    const violations: SafetyViolation[] = [];

    // Step 19 section 7 / Master Index section 22: no deterministic certainty
    // where none exists. "You will lose your job" is the canonical failure.
    const certaintyPatterns = [
      /\byou\s+will\s+(definitely|certainly|surely)\b/,
      /\byou\s+are\s+going\s+to\s+(lose|fail|get\s+fired|be\s+fired)\b/,
      /\bis\s+guaranteed\s+to\b/,
      /\bwill\s+definitely\s+(happen|occur)\b/,
      /\bthere\s+is\s+no\s+doubt\s+that\s+you\b/,
      /\byou\s+will\s+(lose|fail)\s+your\b/,
    ];
    if (certaintyPatterns.some((p) => p.test(text))) {
      violations.push(SafetyViolation.UNSUPPORTED_CERTAINTY);
    }

    // Step 19 section 10: no fatalism. Nothing is "written" or unavoidable.
    const fatalismPatterns = [
      /\bnothing\s+(you\s+)?can\s+(be\s+)?do(ne)?\b/,
      /\b(it|this)\s+is\s+(your\s+)?(fate|destiny|written)\b/,
      /\bcannot\s+be\s+(avoided|changed|escaped)\b/,
      /\bno\s+way\s+(out|to\s+avoid)\b/,
    ];
    if (fatalismPatterns.some((p) => p.test(text))) {
      violations.push(SafetyViolation.FATALISM);
    }

    // Step 19 section 9: preparation, not fear. Step 29 Rule 71 forbids using
    // predicted misfortune commercially.
    const fearPatterns = [
      /\b(disaster|catastroph(e|ic)|doomed|ruined)\b/,
      /\byou\s+should\s+be\s+(very\s+)?(afraid|scared|worried)\b/,
      /\bbefore\s+it\s+is\s+too\s+late\b/,
    ];
    if (fearPatterns.some((p) => p.test(text))) {
      violations.push(SafetyViolation.FEAR_AMPLIFICATION);
    }

    // Step 19 sections 19-28: when the policy required a professional boundary,
    // the output must actually contain one.
    if (
      input.assessment.actions.includes(SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY)
    ) {
      const boundaryPresent =
        /\b(professional|adviser|advisor|lawyer|doctor|specialist|qualified)\b/.test(
          text,
        );
      if (!boundaryPresent) {
        violations.push(SafetyViolation.PROFESSIONAL_BOUNDARY_VIOLATION);
      }
    }

    // Step 19 section 32 / Build Rule 51: a remedy may only come from the
    // approved Rulebook. Until the Rulebook engine exists, any remedy-shaped
    // language in generated output is by definition ungrounded.
    if (
      input.assessment.blockedCapabilities.includes(
        SafetyBlockedCapability.ASTROLOGY_REMEDY,
      )
    ) {
      const remedyPatterns = [
        /\b(wear|donate|chant|recite|perform|offer)\s+(a|an|the)?\s*\w*\s*(gemstone|stone|mantra|puja|ritual|yantra|rudraksha)\b/,
        /\b(gemstone|mantra|puja|yantra|rudraksha)\b/,
      ];
      if (remedyPatterns.some((p) => p.test(text))) {
        violations.push(SafetyViolation.UNSAFE_REMEDY);
      }
    }

    const allowed = violations.length === 0;
    return {
      allowed,
      // Step 21 section 129: block or rewrite, never ship it as-is.
      rewriteRequired: !allowed,
      violations,
    };
  }

  /** Persists a decision for provenance. Step 20 section 62. */
  async recordDecision(
    manager: EntityManager,
    params: {
      userId: string;
      challengeId?: string | null;
      operation: string;
      assessment: SafetyAssessment;
    },
  ): Promise<ZunoSafetyDecision> {
    const { assessment } = params;
    const decision = manager.create(ZunoSafetyDecision, {
      user_id: params.userId,
      challenge_id: params.challengeId ?? null,
      operation: params.operation,
      risk_level: assessment.riskLevel,
      disposition: assessment.disposition,
      domains: assessment.domains,
      flags: assessment.flags,
      actions: assessment.actions,
      blocked_capabilities: assessment.blockedCapabilities,
      matched_rule_ids: assessment.matchedRuleIds,
      policy_version: assessment.policyVersion,
      redacted_at: null,
    });
    return manager.save(ZunoSafetyDecision, decision);
  }

  /** Raises an incident for human review. Step 20 section 63. */
  async recordIncident(
    manager: EntityManager,
    params: {
      userId?: string | null;
      safetyDecisionId?: string | null;
      responseId?: string | null;
      source: string;
      domain?: ZunoDomain | null;
      severity: ZunoRiskClass;
      violations: SafetyViolation[];
    },
  ): Promise<ZunoSafetyIncident> {
    // Logged without any user text - the incident row carries labels only.
    this.logger.warn(
      `Safety incident [${params.source}] severity=${params.severity} violations=${params.violations.join(',')}`,
    );
    const incident = manager.create(ZunoSafetyIncident, {
      user_id: params.userId ?? null,
      safety_decision_id: params.safetyDecisionId ?? null,
      related_response_id: params.responseId ?? null,
      source: params.source,
      domain: params.domain ?? null,
      severity: params.severity,
      violations: params.violations,
      status: 'OPEN' as const,
      policy_version: ZUNO_SAFETY_POLICY_VERSION,
      resolved_at: null,
      redacted_at: null,
    });
    return manager.save(ZunoSafetyIncident, incident);
  }

  /** True when any detected flag is in the critical set (Step 19 section 16). */
  hasCriticalFlag(flags: SafetyFlag[]): boolean {
    return flags.some((flag) => CRITICAL_SAFETY_FLAGS.includes(flag));
  }

  private matchRules(flags: SafetyFlag[], domains: ZunoDomain[]): SafetyRule[] {
    return activeRules().filter((rule) => {
      if (rule.flag && !flags.includes(rule.flag)) return false;
      if (rule.domain && !domains.includes(rule.domain)) return false;
      // A rule with neither a flag nor a domain would apply universally; the
      // policy has none today, and this guard keeps one from being added by
      // accident.
      return rule.flag !== null || rule.domain !== null;
    });
  }

  private worseRisk(a: ZunoRiskClass, b: ZunoRiskClass): ZunoRiskClass {
    return RISK_CLASS_SEVERITY[b] > RISK_CLASS_SEVERITY[a] ? b : a;
  }

  private worseDisposition(
    a: SafetyDisposition,
    b: SafetyDisposition,
  ): SafetyDisposition {
    return SAFETY_DISPOSITION_SEVERITY[b] > SAFETY_DISPOSITION_SEVERITY[a] ? b : a;
  }
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
