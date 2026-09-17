import { SafetyService } from './safety.service';
import { SafetySignalDetector } from './safety-signal-detector';
import {
  SafetyAction,
  SafetyBlockedCapability,
  SafetyDisposition,
  SafetyFlag,
  SafetyViolation,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

/**
 * Safety is a release gate (Build Rule 100), so these are not optional tests.
 * Step 29 Build Rule 99-100: security and safety suites are gates, not backlog.
 */
describe('SafetyService', () => {
  let service: SafetyService;

  beforeEach(() => {
    service = new SafetyService(new SafetySignalDetector());
  });

  const base = { operation: 'TEST', userId: 'user-1', challengeId: null };

  describe('critical safety detection', () => {
    it('blocks and escalates on a self-harm signal', () => {
      const result = service.preCheck({
        ...base,
        text: 'I do not want to live anymore, there is no point',
        domains: [ZunoDomain.PERSONAL_GROWTH],
      });

      // Step 19 section 16: critical handling overrides normal response flows.
      expect(result.flags).toContain(SafetyFlag.SELF_HARM);
      expect(result.disposition).toBe(SafetyDisposition.CRITICAL_ESCALATION);
      expect(result.riskLevel).toBe(ZunoRiskClass.CRITICAL_SAFETY);
      expect(result.blocked).toBe(true);
      expect(result.astrologySuppressed).toBe(true);
    });

    /*
     * Regression: the detector once matched only present-tense forms, so
     * "what if I killed myself" and "if I ended my life" were not flagged.
     * Hypothetical and retrospective framing is one of the commonest ways the
     * thought is voiced - and it is exactly what reaches a What-If prompt.
     */
    it.each([
      'what if I killed myself',
      'sometimes I think about what would happen if I ended my life',
      'there were months when I wanted to die',
      'I planned to die last year and never told anyone',
      'I harmed myself when things got bad',
    ])('detects a past-tense or hypothetical self-harm signal: %s', (text) => {
      const result = service.preCheck({
        ...base,
        text,
        domains: [ZunoDomain.PERSONAL_GROWTH],
      });

      expect(result.flags).toContain(SafetyFlag.SELF_HARM);
      expect(result.blocked).toBe(true);
      expect(result.astrologySuppressed).toBe(true);
    });

    it('detects abuse and suppresses astrology', () => {
      const result = service.preCheck({
        ...base,
        text: 'My husband hits me and I am afraid for my safety',
        domains: [ZunoDomain.MARRIAGE],
      });

      expect(result.flags).toContain(SafetyFlag.ABUSE);
      expect(result.astrologySuppressed).toBe(true);
      expect(result.actions).toContain(SafetyAction.ESCALATE_CRITICAL);
    });

    it('runs deterministically without any model involvement', () => {
      // Step 19 section 55: deterministic systems control escalation. This must
      // work when the AI provider is down, which is exactly when it matters.
      const result = service.preCheck({
        ...base,
        text: 'I am thinking about killing myself',
        domains: [],
      });
      expect(result.blocked).toBe(true);
    });

    it('does not fire on ordinary words that merely contain a keyword', () => {
      const result = service.preCheck({
        ...base,
        text: 'I want more harmony at home and a calmer routine',
        domains: [ZunoDomain.FAMILY],
      });
      expect(result.flags).toHaveLength(0);
    });
  });

  describe('high-stakes domain boundaries', () => {
    it('requires a professional boundary for immigration questions', () => {
      const result = service.preCheck({
        ...base,
        text: 'Will I be able to stay in the country if I lose my job?',
        domains: [ZunoDomain.CAREER, ZunoDomain.FOREIGN_RESIDENCE],
      });

      // Step 19 section 23.
      expect(result.disposition).toBe(
        SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
      );
      expect(result.actions).toContain(
        SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
      );
      expect(result.blockedCapabilities).toContain(
        SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME,
      );
      expect(result.boundaryMessage).toBeDefined();
    });

    it('takes the most restrictive disposition across mixed domains', () => {
      // CAREER alone is ALLOW_WITH_BOUNDARY; adding FOREIGN_RESIDENCE must
      // raise, never average (Step 19 section 3).
      const careerOnly = service.preCheck({
        ...base,
        text: 'Thinking about my next role',
        domains: [ZunoDomain.CAREER],
      });
      const mixed = service.preCheck({
        ...base,
        text: 'Thinking about my next role',
        domains: [ZunoDomain.CAREER, ZunoDomain.FOREIGN_RESIDENCE],
      });

      expect(careerOnly.disposition).toBe(SafetyDisposition.ALLOW_WITH_BOUNDARY);
      expect(mixed.disposition).toBe(
        SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
      );
      expect(mixed.riskLevel).toBe(ZunoRiskClass.HIGH_STAKES);
    });

    it('suppresses astrology entirely for health questions', () => {
      // Step 19 section 24: astrology must not substitute for medical care.
      const result = service.preCheck({
        ...base,
        text: 'I have been unwell and I am worried',
        domains: [ZunoDomain.HEALTH_WELLBEING],
      });

      expect(result.astrologySuppressed).toBe(true);
      expect(result.blockedCapabilities).toContain(
        SafetyBlockedCapability.ASTROLOGY_REMEDY,
      );
    });

    it('escalates finance to high stakes on a severe financial signal', () => {
      const result = service.preCheck({
        ...base,
        text: 'I cannot pay my mortgage and I may lose my home',
        domains: [ZunoDomain.FINANCE],
      });

      expect(result.flags).toContain(SafetyFlag.SEVERE_FINANCIAL_RISK);
      expect(result.riskLevel).toBe(ZunoRiskClass.HIGH_STAKES);
    });
  });

  describe('model-supplied flags', () => {
    it('accepts a flag the deterministic detector missed', () => {
      const result = service.preCheck({
        ...base,
        text: 'something the patterns do not cover',
        domains: [ZunoDomain.LEGAL],
        modelFlags: [SafetyFlag.SERIOUS_LEGAL_RISK],
      });
      expect(result.flags).toContain(SafetyFlag.SERIOUS_LEGAL_RISK);
    });

    it('cannot be talked down by a model that reports nothing', () => {
      // Step 19 section 55: AI may detect and draft; the policy decides. An
      // empty modelFlags array must not erase a deterministic detection.
      const result = service.preCheck({
        ...base,
        text: 'I want to end my life',
        domains: [],
        modelFlags: [],
      });
      expect(result.flags).toContain(SafetyFlag.SELF_HARM);
      expect(result.blocked).toBe(true);
    });
  });

  describe('refineWithDomains', () => {
    it('carries earlier flags into the second pass', () => {
      // The first pre-check runs before classification, so domain rules cannot
      // have fired. Nothing may be lost between the two passes.
      const first = service.preCheck({
        ...base,
        text: 'I cannot pay my loan',
        domains: [],
      });
      const second = service.refineWithDomains(first, {
        ...base,
        text: 'I cannot pay my loan',
        domains: [ZunoDomain.FINANCE, ZunoDomain.FOREIGN_RESIDENCE],
      });

      expect(second.flags).toContain(SafetyFlag.SEVERE_FINANCIAL_RISK);
      expect(second.riskLevel).toBe(ZunoRiskClass.HIGH_STAKES);
    });
  });

  describe('post-check', () => {
    const allowAssessment = {
      riskLevel: ZunoRiskClass.MODERATE_RISK,
      disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
      domains: [ZunoDomain.CAREER],
      flags: [],
      actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
      blockedCapabilities: [SafetyBlockedCapability.DETERMINISTIC_PREDICTION],
      matchedRuleIds: ['SAFE-CAR-001'],
      policyVersion: '1.0',
      blocked: false,
      astrologySuppressed: false,
    };

    it('blocks unsupported certainty', () => {
      // Master Index section 22: "You will lose your job" is the canonical
      // thing ZUNO must never say.
      const result = service.postCheck({
        userId: 'u1',
        candidateText: 'You will definitely lose your job in December.',
        assessment: allowAssessment,
      });

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain(SafetyViolation.UNSUPPORTED_CERTAINTY);
    });

    it('blocks fatalism', () => {
      const result = service.postCheck({
        userId: 'u1',
        candidateText: 'This is your fate and it cannot be avoided.',
        assessment: allowAssessment,
      });
      expect(result.violations).toContain(SafetyViolation.FATALISM);
    });

    it('blocks fear amplification', () => {
      // Step 19 section 9 and Build Rule 71: never sell through fear.
      const result = service.postCheck({
        userId: 'u1',
        candidateText: 'Act now, before it is too late, or this will be a disaster.',
        assessment: allowAssessment,
      });
      expect(result.violations).toContain(SafetyViolation.FEAR_AMPLIFICATION);
    });

    it('allows properly hedged language', () => {
      const result = service.postCheck({
        userId: 'u1',
        candidateText:
          'This period shows more uncertainty than usual, so preparing now is worthwhile. Nothing here is settled.',
        assessment: allowAssessment,
      });
      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('rejects output that omits a required professional boundary', () => {
      const result = service.postCheck({
        userId: 'u1',
        candidateText: 'Here is exactly what will happen with your visa status.',
        assessment: {
          ...allowAssessment,
          actions: [
            SafetyAction.ALLOW_GENERAL_GUIDANCE,
            SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
          ],
        },
      });
      expect(result.violations).toContain(
        SafetyViolation.PROFESSIONAL_BOUNDARY_VIOLATION,
      );
    });

    it('accepts output that includes the required boundary', () => {
      const result = service.postCheck({
        userId: 'u1',
        candidateText:
          'We can prepare your questions, though the current rules are worth confirming with a qualified immigration adviser.',
        assessment: {
          ...allowAssessment,
          actions: [
            SafetyAction.ALLOW_GENERAL_GUIDANCE,
            SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
          ],
        },
      });
      expect(result.allowed).toBe(true);
    });

    it('blocks ungrounded remedy language when astrology is suppressed', () => {
      // Build Rule 51: no Rulebook match means no remedy, ever. Until the
      // Rulebook engine exists, all remedy language is ungrounded.
      const result = service.postCheck({
        userId: 'u1',
        candidateText: 'You should wear a yellow gemstone and chant daily.',
        assessment: {
          ...allowAssessment,
          blockedCapabilities: [SafetyBlockedCapability.ASTROLOGY_REMEDY],
        },
      });
      expect(result.violations).toContain(SafetyViolation.UNSAFE_REMEDY);
      expect(result.rewriteRequired).toBe(true);
    });
  });
});
