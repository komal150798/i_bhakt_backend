"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scenario_context_service_1 = require("./scenario-context.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHALLENGE_ID = '33333333-3333-4333-8333-333333333333';
function build(options) {
    const challenges = { findOne: jest.fn(async () => options.challenge ?? null) };
    const contexts = { findOne: jest.fn(async () => options.context ?? null) };
    const challengeDomains = { find: jest.fn(async () => options.domains ?? []) };
    const rulebook = {
        getActive: options.rulebook?.getActive ?? jest.fn(async () => null),
        findRules: options.rulebook?.findRules ?? jest.fn(async () => []),
    };
    const service = new scenario_context_service_1.ScenarioContextService(challenges, contexts, challengeDomains, new zuno_ownership_service_1.ZunoOwnershipService(), rulebook);
    return { service, challenges, contexts, challengeDomains, rulebook };
}
function challengeRow(userId = USER_ID) {
    return {
        id: CHALLENGE_ID,
        user_id: userId,
        primary_domain: enums_1.ZunoDomain.CAREER,
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
                    type: enums_1.ContextItemType.FACT,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.95,
                },
                {
                    text: 'They may lose their job',
                    type: enums_1.ContextItemType.FEAR,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.97,
                },
                {
                    text: 'Their employer is in trouble',
                    type: enums_1.ContextItemType.ASSUMPTION,
                    source: enums_1.ContextItemSource.INFERRED,
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
            const { service } = build({ challenge: challengeRow(OTHER_USER_ID) });
            await expect(service.requireOwnedChallenge(USER_ID, CHALLENGE_ID)).rejects.toMatchObject({ code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND });
        });
        it('returns NOT_FOUND for a challenge that does not exist', async () => {
            const { service } = build({ challenge: null });
            await expect(service.requireOwnedChallenge(USER_ID, CHALLENGE_ID)).rejects.toBeInstanceOf(zuno_exception_1.ZunoException);
        });
        it('checks ownership before reading anything else', async () => {
            const { service, contexts } = build({ challenge: challengeRow(OTHER_USER_ID) });
            await expect(service.project(USER_ID, CHALLENGE_ID)).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.NOT_FOUND,
            });
            expect(contexts.findOne).not.toHaveBeenCalled();
        });
    });
    describe('projection (Step 11 section 8, Step 12 section 7)', () => {
        it('keeps facts and concerns separate on the way into the engine', async () => {
            const { service } = build({
                challenge: challengeRow(),
                context: contextRow(),
                domains: [{ domain: enums_1.ZunoDomain.CAREER }, { domain: enums_1.ZunoDomain.FINANCE }],
            });
            const projection = await service.project(USER_ID, CHALLENGE_ID);
            expect(projection.facts).toEqual(['Layoffs are occurring at the employer']);
            expect(projection.concerns).toEqual([
                'They may lose their job',
                'Their employer is in trouble',
            ]);
            expect(projection.domains).toEqual([
                enums_1.ZunoDomain.CAREER,
                enums_1.ZunoDomain.FINANCE,
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
            const { service } = build({ challenge: challengeRow(), context: null });
            await expect(service.project(USER_ID, CHALLENGE_ID)).rejects.toMatchObject({
                code: error_codes_enum_1.ZunoErrorCode.PROCESSING,
            });
        });
        it('falls back to the primary domain when no domain rows exist yet', async () => {
            const { service } = build({
                challenge: challengeRow(),
                context: contextRow(),
                domains: [],
            });
            const projection = await service.project(USER_ID, CHALLENGE_ID);
            expect(projection.domains).toEqual([enums_1.ZunoDomain.CAREER]);
        });
    });
    describe('failing closed for astrology, gracefully (Step 20 section 125)', () => {
        it('returns null when no Rulebook version is active', async () => {
            const { service } = build({
                rulebook: { getActive: jest.fn(async () => null) },
            });
            await expect(service.loadAstroContext([enums_1.ZunoDomain.CAREER])).resolves.toBeNull();
        });
        it('does not call findRules when there is no active version', async () => {
            const { service, rulebook } = build({
                rulebook: { getActive: jest.fn(async () => null) },
            });
            await service.loadAstroContext([enums_1.ZunoDomain.CAREER]);
            expect(rulebook.findRules).not.toHaveBeenCalled();
        });
        it('swallows RULEBOOK_UNAVAILABLE rather than failing the whole request', async () => {
            const { service } = build({
                rulebook: {
                    getActive: jest.fn(async () => ({
                        versionId: 'rb-1',
                        version: '1.0',
                        activatedAt: null,
                        hash: 'x',
                    })),
                    findRules: jest.fn(async () => {
                        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.RULEBOOK_UNAVAILABLE);
                    }),
                },
            });
            await expect(service.loadAstroContext([enums_1.ZunoDomain.CAREER])).resolves.toBeNull();
        });
        it('returns null when the Rulebook is active but matches no approved rule', async () => {
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
            await expect(service.loadAstroContext([enums_1.ZunoDomain.CAREER])).resolves.toBeNull();
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
                            direction: enums_1.ThemeDirection.CAUTION,
                        },
                        {
                            external_rule_key: 'ASTRO-CAREER-002',
                            theme: 'RECOVERY_SUPPORT',
                            direction: enums_1.ThemeDirection.SUPPORTIVE,
                        },
                        {
                            external_rule_key: 'ASTRO-CAREER-003',
                            theme: 'TRANSITION',
                            direction: enums_1.ThemeDirection.MIXED,
                        },
                        {
                            external_rule_key: 'ASTRO-CAREER-004',
                            theme: 'STABILITY',
                            direction: enums_1.ThemeDirection.NEUTRAL,
                        },
                    ]),
                },
            });
            const astro = await service.loadAstroContext([enums_1.ZunoDomain.CAREER]);
            expect(astro).not.toBeNull();
            expect(astro.caution_themes).toEqual(['VOLATILITY', 'TRANSITION']);
            expect(astro.supportive_themes).toEqual([
                'RECOVERY_SUPPORT',
                'TRANSITION',
            ]);
            expect(astro.supportive_themes).not.toContain('STABILITY');
            expect(astro.caution_themes).not.toContain('STABILITY');
            expect(astro.rule_keys).toHaveLength(4);
            expect(astro.rulebook_version_id).toBe('rb-1');
            expect(astro.timing_windows).toEqual([]);
        });
    });
});
//# sourceMappingURL=scenario-context.service.spec.js.map