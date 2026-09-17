import { ResponseComposerService } from './response-composer.service';
import { SafetyAssessment } from '../../safety/services/safety.service';
import {
  ContextItemSource,
  ContextItemType,
  ResponseDepth,
  ResponseSectionType,
  SafetyAction,
  SafetyBlockedCapability,
  SafetyDisposition,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';
import { ChallengeContextPayload } from '../../challenges/entities/challenge-context.types';
import {
  ContextValidationPayload,
  ClarificationPayload,
  FocusPrioritiesPayload,
} from '../entities/response.types';

describe('ResponseComposerService', () => {
  const composer = new ResponseComposerService();

  const allowSafety: SafetyAssessment = {
    riskLevel: ZunoRiskClass.MODERATE_RISK,
    disposition: SafetyDisposition.ALLOW_WITH_BOUNDARY,
    domains: [ZunoDomain.CAREER],
    flags: [],
    actions: [SafetyAction.ALLOW_GENERAL_GUIDANCE],
    blockedCapabilities: [],
    matchedRuleIds: ['SAFE-CAR-001'],
    policyVersion: '1.0',
    blocked: false,
    astrologySuppressed: false,
  };

  function context(
    overrides: Partial<ChallengeContextPayload> = {},
  ): ChallengeContextPayload {
    return {
      summary: 'Your job and your loan are tied together right now.',
      items: [
        {
          id: '1',
          text: 'Layoffs are occurring at the employer',
          type: ContextItemType.FACT,
          source: ContextItemSource.USER_STATED,
          confidence: 0.95,
        },
        {
          id: '2',
          text: 'They may lose their job',
          type: ContextItemType.FEAR,
          source: ContextItemSource.USER_STATED,
          confidence: 0.97,
        },
      ],
      dependencies: [
        {
          id: 'd1',
          from: 'Employment',
          to: 'Income',
          source: ContextItemSource.USER_STATED,
          confidence: 0.9,
        },
      ],
      desired_outcomes: [],
      decisions: [],
      factors: {
        controllable: ['CV readiness', 'Networking', 'Loan planning', 'Budget'],
        external: ['Employer decisions'],
      },
      temporal_anchors: [],
      missing_information: [],
      emotional_signals: [],
      subthemes: [],
      ...overrides,
    };
  }

  it('keeps facts and fears in separate arrays', () => {
    const payload = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });

    const section = payload.sections.find(
      (s) => s.type === ResponseSectionType.CONTEXT_VALIDATION,
    );
    const validation = section!.payload as ContextValidationPayload;

    // Step 11 section 8: the two must never be merged into one list, because a
    // merged list is exactly how a fear gets rendered as settled fact.
    expect(validation.understood).toContain('Layoffs are occurring at the employer');
    expect(validation.understood).not.toContain('They may lose their job');
    expect(validation.concerns).toContain('They may lose their job');
  });

  it('invites correction', () => {
    // Step 30 Phase 3 acceptance: "user can correct interpretation".
    const payload = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });
    const validation = payload.sections[0].payload as ContextValidationPayload;
    expect(validation.correction_invited).toBe(true);
  });

  it('varies the number of sections rather than emitting a fixed set', () => {
    // Build Rule 15 / Step 21 Rule 19: never hard-code eight screens.
    const rich = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });
    const sparse = composer.compose({
      context: context({
        dependencies: [],
        factors: { controllable: [], external: [] },
      }),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });

    expect(rich.sections.length).toBeGreaterThan(sparse.sections.length);
    expect(sparse.sections).toHaveLength(1);
  });

  it('caps focus priorities and draws them only from controllable factors', () => {
    const payload = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });
    const section = payload.sections.find(
      (s) => s.type === ResponseSectionType.FOCUS_PRIORITIES,
    );
    const priorities = (section!.payload as FocusPrioritiesPayload).priorities;

    // Step 02 section 18 caps priorities at 3-4; Step 11 section 23 says they
    // must be things the person can actually influence.
    expect(priorities.length).toBeLessThanOrEqual(3);
    expect(priorities.map((p) => p.title)).not.toContain('Employer decisions');
  });

  it('shows less when the person is under strain', () => {
    // Step 11 section 25 / Step 00 section 8: progressive disclosure.
    const quick = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.QUICK,
      safety: allowSafety,
    });
    const standard = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });

    const quickPriorities = (
      quick.sections.find((s) => s.type === ResponseSectionType.FOCUS_PRIORITIES)!
        .payload as FocusPrioritiesPayload
    ).priorities;
    const standardPriorities = (
      standard.sections.find(
        (s) => s.type === ResponseSectionType.FOCUS_PRIORITIES,
      )!.payload as FocusPrioritiesPayload
    ).priorities;

    expect(quickPriorities.length).toBeLessThan(standardPriorities.length);
  });

  describe('clarification', () => {
    const clarifying = context({
      missing_information: [
        { id: 'q1', question: 'Which worries you more?', information_gain: 0.9, rationale: 'r' },
        { id: 'q2', question: 'How long have you been there?', information_gain: 0.5, rationale: 'r' },
        { id: 'q3', question: 'Do you have savings?', information_gain: 0.4, rationale: 'r' },
      ],
    });

    it('still shows understanding before asking anything', () => {
      // Step 11 section 29: understand enough, give value, THEN ask. A response
      // that is only questions is the failure mode this guards.
      const payload = composer.compose({
        context: clarifying,
        clarificationRequired: true,
        responseDepth: ResponseDepth.STANDARD,
        safety: allowSafety,
      });

      expect(payload.sections[0].type).toBe(
        ResponseSectionType.CONTEXT_VALIDATION,
      );
      expect(payload.sections[1].type).toBe(ResponseSectionType.CLARIFICATION);
    });

    it('asks at most two questions', () => {
      const payload = composer.compose({
        context: clarifying,
        clarificationRequired: true,
        responseDepth: ResponseDepth.STANDARD,
        safety: allowSafety,
      });
      const questions = (
        payload.sections[1].payload as ClarificationPayload
      ).questions;
      expect(questions.length).toBeLessThanOrEqual(2);
    });

    it('does not offer priorities on an admittedly incomplete understanding', () => {
      const payload = composer.compose({
        context: clarifying,
        clarificationRequired: true,
        responseDepth: ResponseDepth.STANDARD,
        safety: allowSafety,
      });
      expect(
        payload.sections.some(
          (s) => s.type === ResponseSectionType.FOCUS_PRIORITIES,
        ),
      ).toBe(false);
    });
  });

  describe('safety shaping', () => {
    it('replaces the whole response when safety blocks', () => {
      // Step 19 section 3: safety is above every other system.
      const payload = composer.compose({
        context: context(),
        clarificationRequired: false,
        responseDepth: ResponseDepth.STANDARD,
        safety: {
          ...allowSafety,
          blocked: true,
          disposition: SafetyDisposition.CRITICAL_ESCALATION,
          riskLevel: ZunoRiskClass.CRITICAL_SAFETY,
        },
      });

      expect(payload.sections).toHaveLength(1);
      expect(payload.sections[0].type).toBe(ResponseSectionType.SAFETY_BOUNDARY);
    });

    it('appends a boundary without withholding the useful part', () => {
      // Step 19 section 19: ZUNO may still help, within limits. A boundary is
      // an addition, not a substitution.
      const payload = composer.compose({
        context: context(),
        clarificationRequired: false,
        responseDepth: ResponseDepth.STANDARD,
        safety: {
          ...allowSafety,
          disposition: SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
          boundaryMessage: 'I should not present the outcome as certain.',
          suggestedSupport: 'a qualified legal professional',
          actions: [
            SafetyAction.ALLOW_GENERAL_GUIDANCE,
            SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
          ],
          blockedCapabilities: [SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME],
        },
      });

      expect(
        payload.sections.some(
          (s) => s.type === ResponseSectionType.CONTEXT_VALIDATION,
        ),
      ).toBe(true);
      const boundary = payload.sections.find(
        (s) => s.type === ResponseSectionType.SAFETY_BOUNDARY,
      );
      expect(boundary).toBeDefined();
      // The boundary is last, so it reads as a caveat rather than a refusal.
      expect(boundary!.order).toBe(payload.sections.length);
    });
  });

  it('returns content structure only, never layout instructions', () => {
    // Step 21 section 30: the client owns layout, theme and animation.
    const payload = composer.compose({
      context: context(),
      clarificationRequired: false,
      responseDepth: ResponseDepth.STANDARD,
      safety: allowSafety,
    });

    const serialised = JSON.stringify(payload);
    expect(serialised).not.toMatch(/color|width|padding|widget|font|px"|#[0-9a-f]{6}/i);
    for (const section of payload.sections) {
      expect(section.emphasis).toBeDefined();
      expect(typeof section.order).toBe('number');
    }
  });
});
