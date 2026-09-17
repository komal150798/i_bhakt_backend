import { ScenarioContextService } from './scenario-context.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  ContextItemSource,
  ContextItemType,
  ThemeDirection,
  ZunoDomain,
} from '../../common/enums';

/**
 * ScenarioContextService is where two rules that are easy to get wrong live:
 * ownership masking, and failing closed for astrology without failing the
 * request. Both are tested here rather than only through the engines, because
 * both must hold on every path into the module.
 */

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';

function build(options: {
  challenge?: unknown;
  context?: unknown;
  domains?: unknown[];
  rulebook?: Partial<{
    getActive: jest.Mock;
    findRules: jest.Mock;
  }>;
}) {
  const challenges = { findOne: jest.fn(async () => options.challenge ?? null) };
  const contexts = { findOne: jest.fn(async () => options.context ?? null) };
  const challengeDomains = { find: jest.fn(async () => options.domains ?? []) };

  const rulebook = {
    getActive: options.rulebook?.getActive ?? jest.fn(async () => null),
    findRules: options.rulebook?.findRules ?? jest.fn(async () => []),
  };

  const service = new ScenarioContextService(
    challenges as any,
    contexts as any,
    challengeDomains as any,
    new ZunoOwnershipService(),
    rulebook as any,
  );

  return { service, challenges, contexts, challengeDomains, rulebook };
}

function challengeRow(userId = USER_ID) {
  return {
    id: CHALLENGE_ID,
    user_id: userId,
    primary_domain: ZunoDomain.CAREER,
    raw_user_statement: 'Layoffs are happening at my company.',
  };
}

function contextRow() {
  return {
    version_number: 2,
    summary: 'Layoffs at work have put income and the home loan in one question.',
    payload: {
      items: [
        {
          text: 'Layoffs are occurring at the employer',
          type: ContextItemType.FACT,
          source: ContextItemSource.USER_STATED,
          confidence: 0.95,
        },
        {
          text: 'They may lose their job',
          type: ContextItemType.FEAR,
          source: ContextItemSource.USER_STATED,
          confidence: 0.97,
        },
        {
          text: 'Their employer is in trouble',
          type: ContextItemType.ASSUMPTION,
          source: ContextItemSource.INFERRED,
          confidence: 0.6,
        },
      ],
      dependencies: [{ from: 'Employment', to: 'Monthly income' }],
      decisions: [],
      factors: { controllable: ['CV readiness'], external: ['Restructuring'] },
      temporal_anchors: [{ raw: 'four months away', normalized_date: null }],
    },
  };
}

describe('ScenarioContextService', () => {
  describe('ownership (Step 21 section 106, Golden Contract Test 125)', () => {
    it('masks another user\'s challenge as NOT_FOUND, never FORBIDDEN', async () => {
      // A 403 would confirm the id exists, turning the endpoint into an
      // enumeration oracle.
      const { service } = build({ challenge: challengeRow(OTHER_USER_ID) });

      await expect(
        service.requireOwnedChallenge(USER_ID, CHALLENGE_ID),
      ).rejects.toMatchObject({ code: ZunoErrorCode.NOT_FOUND });
    });

    it('returns NOT_FOUND for a challenge that does not exist', async () => {
      const { service } = build({ challenge: null });
      await expect(
        service.requireOwnedChallenge(USER_ID, CHALLENGE_ID),
      ).rejects.toBeInstanceOf(ZunoException);
    });

    it('checks ownership before reading anything else', async () => {
      const { service, contexts } = build({ challenge: challengeRow(OTHER_USER_ID) });

      await expect(service.project(USER_ID, CHALLENGE_ID)).rejects.toMatchObject({
        code: ZunoErrorCode.NOT_FOUND,
      });
      expect(contexts.findOne).not.toHaveBeenCalled();
    });
  });

  describe('projection (Step 11 section 8, Step 12 section 7)', () => {
    it('keeps facts and concerns separate on the way into the engine', async () => {
      // Step 11 section 8 is the invariant this projection exists to preserve:
      // a fear must never arrive at the scenario engine labelled as a fact.
      const { service } = build({
        challenge: challengeRow(),
        context: contextRow(),
        domains: [{ domain: ZunoDomain.CAREER }, { domain: ZunoDomain.FINANCE }],
      });

      const projection = await service.project(USER_ID, CHALLENGE_ID);

      expect(projection.facts).toEqual(['Layoffs are occurring at the employer']);
      expect(projection.concerns).toEqual([
        'They may lose their job',
        'Their employer is in trouble',
      ]);
      expect(projection.domains).toEqual([
        ZunoDomain.CAREER,
        ZunoDomain.FINANCE,
      ]);
    });

    it('includes the raw statement in the text the safety pre-check reads', async () => {
      const { service } = build({
        challenge: challengeRow(),
        context: contextRow(),
      });
      const projection = await service.project(USER_ID, CHALLENGE_ID);
      expect(projection.safetyText).toContain('Layoffs are happening at my company.');
    });

    it('reports PROCESSING rather than inventing an understanding', async () => {
      // Step 12 section 55 starts the pipeline at the Challenge Context.
      // Without one there is nothing to branch from, and Step 21 section 109
      // prefers an honest processing state to a fabricated result.
      const { service } = build({ challenge: challengeRow(), context: null });

      await expect(service.project(USER_ID, CHALLENGE_ID)).rejects.toMatchObject({
        code: ZunoErrorCode.PROCESSING,
      });
    });

    it('falls back to the primary domain when no domain rows exist yet', async () => {
      const { service } = build({
        challenge: challengeRow(),
        context: contextRow(),
        domains: [],
      });
      const projection = await service.project(USER_ID, CHALLENGE_ID);
      expect(projection.domains).toEqual([ZunoDomain.CAREER]);
    });
  });

  describe('failing closed for astrology, gracefully (Step 20 section 125)', () => {
    it('returns null when no Rulebook version is active', async () => {
      // This is the state of the repository today. It must not be an error.
      const { service } = build({
        rulebook: { getActive: jest.fn(async () => null) },
      });

      await expect(
        service.loadAstroContext([ZunoDomain.CAREER]),
      ).resolves.toBeNull();
    });

    it('does not call findRules when there is no active version', async () => {
      const { service, rulebook } = build({
        rulebook: { getActive: jest.fn(async () => null) },
      });

      await service.loadAstroContext([ZunoDomain.CAREER]);
      expect(rulebook.findRules).not.toHaveBeenCalled();
    });

    it('swallows RULEBOOK_UNAVAILABLE rather than failing the whole request', async () => {
      // Step 21 section 117 / Step 19 section 117: one unavailable part must
      // not make the rest useless. Step 12 section 3 lists astrology among the
      // engine's inputs, not among its requirements.
      const { service } = build({
        rulebook: {
          getActive: jest.fn(async () => ({
            versionId: 'rb-1',
            version: '1.0',
            activatedAt: null,
            hash: 'x',
          })),
          findRules: jest.fn(async () => {
            throw new ZunoException(ZunoErrorCode.RULEBOOK_UNAVAILABLE);
          }),
        },
      });

      await expect(
        service.loadAstroContext([ZunoDomain.CAREER]),
      ).resolves.toBeNull();
    });

    it('returns null when the Rulebook is active but matches no approved rule', async () => {
      // Step 21 section 35: insufficient coverage is reported as insufficient,
      // never filled in by the model.
      const { service } = build({
        rulebook: {
          getActive: jest.fn(async () => ({
            versionId: 'rb-1',
            version: '1.0',
            activatedAt: null,
            hash: 'x',
          })),
          findRules: jest.fn(async () => []),
        },
      });

      await expect(
        service.loadAstroContext([ZunoDomain.CAREER]),
      ).resolves.toBeNull();
    });

    it('returns null for an empty domain list without touching the rulebook', async () => {
      const { service, rulebook } = build({});
      await expect(service.loadAstroContext([])).resolves.toBeNull();
      expect(rulebook.getActive).not.toHaveBeenCalled();
    });

    it('maps approved rules into supportive and caution themes with provenance', async () => {
      const { service } = build({
        rulebook: {
          getActive: jest.fn(async () => ({
            versionId: 'rb-1',
            version: '1.0',
            activatedAt: null,
            hash: 'x',
          })),
          findRules: jest.fn(async () => [
            {
              external_rule_key: 'ASTRO-CAREER-001',
              theme: 'VOLATILITY',
              direction: ThemeDirection.CAUTION,
            },
            {
              external_rule_key: 'ASTRO-CAREER-002',
              theme: 'RECOVERY_SUPPORT',
              direction: ThemeDirection.SUPPORTIVE,
            },
            {
              external_rule_key: 'ASTRO-CAREER-003',
              theme: 'TRANSITION',
              direction: ThemeDirection.MIXED,
            },
            {
              external_rule_key: 'ASTRO-CAREER-004',
              theme: 'STABILITY',
              direction: ThemeDirection.NEUTRAL,
            },
          ]),
        },
      });

      const astro = await service.loadAstroContext([ZunoDomain.CAREER]);

      expect(astro).not.toBeNull();
      expect(astro!.caution_themes).toEqual(['VOLATILITY', 'TRANSITION']);
      expect(astro!.supportive_themes).toEqual([
        'RECOVERY_SUPPORT',
        'TRANSITION',
      ]);
      // A neutral theme shifts attention in neither direction, so it
      // contributes nothing (Step 12 section 47).
      expect(astro!.supportive_themes).not.toContain('STABILITY');
      expect(astro!.caution_themes).not.toContain('STABILITY');
      // Step 20 section 70: provenance travels with the interpretation.
      expect(astro!.rule_keys).toHaveLength(4);
      expect(astro!.rulebook_version_id).toBe('rb-1');
      // Step 12 section 48: timing windows are approved inputs, and an
      // approximation would not be one.
      expect(astro!.timing_windows).toEqual([]);
    });
  });
});
