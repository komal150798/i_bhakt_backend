import { Test } from '@nestjs/testing';
import { WhatNowService } from './whatnow.service';
import {
  IWhatNowEngine,
  WhatNowExtraction,
  WhatNowExtractionResult,
  WHATNOW_ENGINE,
} from '../engines/whatnow.port';
import {
  ChallengeMode,
  ChallengeTimeline,
  ContextItemSource,
  ContextItemType,
  EmotionalIntensity,
  EmotionalSignal,
  GoalStatus,
  ResponseDepth,
  Urgency,
  ZunoDomain,
  ZunoRiskClass,
} from '../../common/enums';

/**
 * Golden fixtures for the Phase 3 vertical slice.
 * Step 30 Implementation Roadmap section 27 names the five cases:
 * career uncertainty, student preparation, relationship uncertainty,
 * ambiguous challenge, simple decision.
 *
 * Build Rule 97: Golden Journeys are behavioural validation and must not be
 * hard-coded into the product. They live here as test fixtures only - nothing
 * in `src/zuno` branches on a persona (Build Rule 17).
 */
class StubWhatNowEngine implements IWhatNowEngine {
  constructor(private readonly extraction: WhatNowExtraction) {}

  async extract(): Promise<WhatNowExtractionResult> {
    return {
      extraction: this.extraction,
      extractorVersion: 'test-engine-1.0.0',
      aiGenerationRunId: 'run-1',
    };
  }
}

function baseExtraction(
  overrides: Partial<WhatNowExtraction> = {},
): WhatNowExtraction {
  return {
    summary: 'A situation the person is working through.',
    primary_domain: ZunoDomain.GENERAL,
    secondary_domains: [],
    theme: null,
    subthemes: [],
    items: [],
    dependencies: [],
    desired_outcomes: [],
    decisions: [],
    controllable: [],
    external: [],
    temporal_anchors: [],
    missing_information: [],
    emotional_signals: [],
    emotional_intensity: EmotionalIntensity.MODERATE,
    urgency: Urgency.MEDIUM,
    safety_flags: [],
    confidence: 0.9,
    ...overrides,
  };
}

async function buildService(extraction: WhatNowExtraction): Promise<WhatNowService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      WhatNowService,
      { provide: WHATNOW_ENGINE, useValue: new StubWhatNowEngine(extraction) },
    ],
  }).compile();
  return moduleRef.get(WhatNowService);
}

describe('WhatNowService', () => {
  describe('Golden: career uncertainty (the Ashish reference case)', () => {
    // Step 20 section 115 / Master Index section 39.
    const extraction = baseExtraction({
      summary:
        'Layoffs at work have put your income, your home loan and your life in Dubai in the same question.',
      primary_domain: ZunoDomain.CAREER,
      secondary_domains: [
        { domain: ZunoDomain.FINANCE, confidence: 0.94 },
        { domain: ZunoDomain.FOREIGN_RESIDENCE, confidence: 0.72 },
      ],
      theme: 'JOB_SECURITY',
      subthemes: ['LAYOFF_RISK', 'FINANCIAL_DEPENDENCY'],
      items: [
        {
          text: 'Layoffs are occurring at the employer',
          type: ContextItemType.FACT,
          source: ContextItemSource.USER_STATED,
          confidence: 0.95,
        },
        {
          text: 'They have a home loan',
          type: ContextItemType.FACT,
          source: ContextItemSource.USER_STATED,
          confidence: 0.98,
        },
        {
          text: 'They may lose their job',
          type: ContextItemType.FEAR,
          source: ContextItemSource.USER_STATED,
          confidence: 0.97,
        },
      ],
      dependencies: [
        { from: 'Employment', to: 'Monthly income' },
        { from: 'Monthly income', to: 'Home loan servicing' },
      ],
      desired_outcomes: [
        {
          goal: 'Maintain financial stability',
          status: GoalStatus.INFERRED,
          confidence: 0.85,
        },
      ],
      controllable: ['CV readiness', 'Networking', 'Loan contingency planning'],
      external: ['Employer restructuring', 'Job market'],
      emotional_signals: [EmotionalSignal.WORRIED],
      emotional_intensity: EmotionalIntensity.HIGH,
      urgency: Urgency.HIGH,
      confidence: 0.91,
    });

    it('classifies the primary domain and keeps every secondary domain', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'irrelevant, engine is stubbed' });

      expect(result.primaryDomain).toBe(ZunoDomain.CAREER);
      // Step 11 section 12: a multidimensional problem must not collapse into
      // a single category.
      expect(result.secondaryDomains.map((d) => d.domain)).toEqual([
        ZunoDomain.FINANCE,
        ZunoDomain.FOREIGN_RESIDENCE,
      ]);
    });

    it('carries the per-domain risk class, not one risk for the whole challenge', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      // FOREIGN_RESIDENCE is HIGH_STAKES even though CAREER is only MODERATE.
      expect(result.domainRisk.get(ZunoDomain.CAREER)).toBe(
        ZunoRiskClass.MODERATE_RISK,
      );
      expect(result.domainRisk.get(ZunoDomain.FOREIGN_RESIDENCE)).toBe(
        ZunoRiskClass.HIGH_STAKES,
      );
    });

    it('never converts a fear into a fact', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      const jobLoss = result.payload.items.find((item) =>
        item.text.includes('may lose their job'),
      );
      // Step 11 Rule 1 and section 8 - the single most important invariant.
      expect(jobLoss?.type).toBe(ContextItemType.FEAR);
      expect(
        result.payload.items.filter((i) => i.type === ContextItemType.FACT),
      ).toHaveLength(2);
    });

    it('enters PREPARE mode when the concern is a fear rather than a loss', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });
      expect(result.mode).toBe(ChallengeMode.PREPARE);
    });

    it('routes to scenario, life-signal and realignment engines', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      // Step 11 sections 38-39: an open, uncertain future needs these.
      expect(result.routing.scenario_engine).toBe(true);
      expect(result.routing.life_signal_engine).toBe(true);
      expect(result.routing.realignment_engine).toBe(true);
      expect(result.routing.plan_engine).toBe(true);
    });

    it('does not ask for clarification when confidence is high', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });
      expect(result.clarificationRequired).toBe(false);
    });

    it('produces a human title, not a classification code', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      // Step 11 Rule 5: internal codes never surface in consumer UX.
      expect(result.title).not.toMatch(/CAREER|JOB_SECURITY|FOREIGN_RESIDENCE/);
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.title.length).toBeLessThanOrEqual(80);
    });
  });

  describe('Golden: ambiguous challenge', () => {
    // Step 11 section 72: "Nothing is working." Do not fabricate a problem.
    const extraction = baseExtraction({
      summary: 'Something feels stuck, but it is not yet clear what.',
      primary_domain: ZunoDomain.GENERAL,
      confidence: 0.31,
      missing_information: [
        {
          question: 'What feels most stuck right now - work, money, relationships, or health?',
          information_gain: 0.95,
          rationale: 'determines which domain we are even in',
        },
        {
          question: 'How long has it felt this way?',
          information_gain: 0.4,
          rationale: 'affects urgency',
        },
      ],
      emotional_signals: [EmotionalSignal.CONFUSED],
    });

    it('asks for clarification instead of guessing a domain', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'Nothing is working.' });

      // Step 11 section 30: below the 0.75 threshold, clarify.
      expect(result.clarificationRequired).toBe(true);
      expect(result.mode).toBe(ChallengeMode.UNDERSTAND);
    });

    it('ranks clarification questions by information gain', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'Nothing is working.' });

      // Step 11 section 31: the question that changes the most comes first.
      expect(result.payload.missing_information[0].question).toContain('most stuck');
    });

    it('does not run downstream engines on an understanding we admit is incomplete', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'Nothing is working.' });

      expect(result.routing.plan_engine).toBe(false);
      expect(result.routing.scenario_engine).toBe(false);
      expect(result.routing.astrology).toBe(false);
    });
  });

  describe('Golden: simple decision', () => {
    const extraction = baseExtraction({
      summary: 'You are weighing leaving a salaried role to start a business.',
      primary_domain: ZunoDomain.CAREER,
      secondary_domains: [
        { domain: ZunoDomain.BUSINESS, confidence: 0.9 },
        { domain: ZunoDomain.FINANCE, confidence: 0.88 },
      ],
      decisions: [
        {
          question: 'Stay employed or start the business?',
          options: ['Stay employed', 'Start the business', 'Transition gradually'],
          confidence: 0.93,
        },
      ],
      controllable: ['Runway calculation', 'Client pipeline'],
      confidence: 0.88,
    });

    it('enters DECIDE mode when a real decision is on the table', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      expect(result.mode).toBe(ChallengeMode.DECIDE);
      expect(result.routing.scenario_engine).toBe(true);
    });
  });

  describe('Golden: student preparation', () => {
    const extraction = baseExtraction({
      summary: 'Your exam is a few months out and focus keeps slipping.',
      primary_domain: ZunoDomain.EDUCATION,
      theme: 'COMPETITIVE_EXAM',
      items: [
        {
          text: 'The exam is roughly four months away',
          type: ContextItemType.FACT,
          source: ContextItemSource.USER_STATED,
          confidence: 0.9,
        },
        {
          text: 'They fear not clearing it',
          type: ContextItemType.FEAR,
          source: ContextItemSource.USER_STATED,
          confidence: 0.92,
        },
      ],
      temporal_anchors: [
        {
          raw: 'four months away',
          // Step 11 section 16: no date was given, so none is invented.
          normalized_date: null,
          timeline: ChallengeTimeline.UPCOMING,
        },
      ],
      controllable: ['Study consistency', 'Mock tests', 'Routine'],
      confidence: 0.87,
    });

    it('preserves an unresolvable date as null rather than guessing one', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      expect(result.payload.temporal_anchors[0].normalized_date).toBeNull();
      expect(result.payload.temporal_anchors[0].raw).toBe('four months away');
    });
  });

  describe('Golden: relationship uncertainty', () => {
    const extraction = baseExtraction({
      summary: 'Four years in, the arguments have become the pattern.',
      primary_domain: ZunoDomain.RELATIONSHIP,
      theme: 'RELATIONSHIP_CONTINUITY',
      decisions: [
        {
          question: 'Continue, repair, or end it?',
          options: ['Continue', 'Repair', 'End'],
          confidence: 0.8,
        },
      ],
      emotional_signals: [EmotionalSignal.UNCERTAIN],
      emotional_intensity: EmotionalIntensity.HIGH,
      confidence: 0.82,
    });

    it('handles the relationship domain through the same framework', async () => {
      const service = await buildService(extraction);
      const result = await service.analyze({ statement: 'x' });

      // Master Index section 40: one framework across domains, no bespoke flow.
      expect(result.primaryDomain).toBe(ZunoDomain.RELATIONSHIP);
      expect(result.mode).toBe(ChallengeMode.DECIDE);
      expect(result.clarificationRequired).toBe(false);
    });
  });

  describe('deterministic invariants', () => {
    it('demotes an INFERRED item that the model labelled as FACT', async () => {
      // Step 11 section 8 / Rule 7: only what the user stated or confirmed can
      // be a hard fact. This is enforced in code, not left to the prompt.
      const service = await buildService(
        baseExtraction({
          primary_domain: ZunoDomain.CAREER,
          items: [
            {
              text: 'Their employer is in financial trouble',
              type: ContextItemType.FACT,
              source: ContextItemSource.INFERRED,
              confidence: 0.7,
            },
          ],
        }),
      );
      const result = await service.analyze({ statement: 'x' });

      expect(result.payload.items[0].type).toBe(ContextItemType.ASSUMPTION);
    });

    it('removes the primary domain if the model repeated it as secondary', async () => {
      const service = await buildService(
        baseExtraction({
          primary_domain: ZunoDomain.CAREER,
          secondary_domains: [
            { domain: ZunoDomain.CAREER, confidence: 0.9 },
            { domain: ZunoDomain.FINANCE, confidence: 0.8 },
          ],
        }),
      );
      const result = await service.analyze({ statement: 'x' });

      // Step 11 section 11: exactly one primary, not duplicated below.
      expect(result.secondaryDomains).toHaveLength(1);
      expect(result.secondaryDomains[0].domain).toBe(ZunoDomain.FINANCE);
    });

    it('reduces response depth when the person is highly distressed', async () => {
      // Step 11 section 25: a very worried user does not get twelve screens.
      const service = await buildService(
        baseExtraction({
          primary_domain: ZunoDomain.FAMILY,
          emotional_intensity: EmotionalIntensity.VERY_HIGH,
        }),
      );
      const result = await service.analyze({ statement: 'x' });

      expect(result.responseDepth).toBe(ResponseDepth.QUICK);
    });

    it('enters RECOVER mode once the feared event is a confirmed fact', async () => {
      // Step 11 section 49: "I received a termination notice today" moves the
      // item from FEAR to FACT, and ZUNO must adapt rather than repeat itself.
      const service = await buildService(
        baseExtraction({
          primary_domain: ZunoDomain.CAREER,
          items: [
            {
              text: 'Their employment was terminated on Friday',
              type: ContextItemType.FACT,
              source: ContextItemSource.USER_STATED,
              confidence: 0.99,
            },
          ],
        }),
      );
      const result = await service.analyze({ statement: 'x' });

      expect(result.mode).toBe(ChallengeMode.RECOVER);
    });

    it('keeps at most three clarification questions', async () => {
      // Step 11 section 29: never turn the experience into a form.
      const service = await buildService(
        baseExtraction({
          confidence: 0.4,
          missing_information: Array.from({ length: 7 }, (_, i) => ({
            question: `Question ${i}`,
            information_gain: i / 10,
            rationale: 'test',
          })),
        }),
      );
      const result = await service.analyze({ statement: 'x' });

      expect(result.payload.missing_information.length).toBeLessThanOrEqual(3);
      // Highest gain first.
      expect(result.payload.missing_information[0].question).toBe('Question 6');
    });
  });
});
