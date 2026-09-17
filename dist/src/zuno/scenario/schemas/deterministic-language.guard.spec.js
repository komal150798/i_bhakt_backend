"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deterministic_language_guard_1 = require("./deterministic-language.guard");
describe('deterministic-language guard', () => {
    describe('rejects determined outcomes (Step 12 Rule 1, Step 19 section 7)', () => {
        const guaranteed = [
            'Your promotion is guaranteed once the review completes.',
            'You will definitely be moved to the new team.',
            'There is no doubt that the restructuring lands this quarter.',
            'Without a doubt the role is being removed.',
            'The outcome is certain to happen before December.',
            'Redundancy here is inevitable.',
        ];
        it.each(guaranteed)('flags %j', (text) => {
            const claims = (0, deterministic_language_guard_1.findDeterministicClaims)(text);
            expect(claims.length).toBeGreaterThan(0);
            expect(claims[0].kind).toBe(deterministic_language_guard_1.DeterministicClaimKind.GUARANTEED_OUTCOME);
        });
    });
    describe('rejects fabricated probability (Step 12 sections 16, 97, Rule 2)', () => {
        const probabilities = [
            '72% chance of termination',
            'There is a 30 percent likelihood of an internal move.',
            'Scenario A - chance of 20%',
            'probability of 0.7 that the role is cut',
            '3 in 10 chance of a counter-offer',
        ];
        it.each(probabilities)('flags %j', (text) => {
            const claims = (0, deterministic_language_guard_1.findDeterministicClaims)(text);
            expect(claims.length).toBeGreaterThan(0);
            expect(claims.map((claim) => claim.kind)).toContain(deterministic_language_guard_1.DeterministicClaimKind.NUMERIC_PROBABILITY);
        });
        it('allows a percentage that is a magnitude, not a probability', () => {
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('The offer involved a 30% pay cut.')).toBe(false);
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('Interest rose by 2 percent this year.')).toBe(false);
        });
    });
    describe('rejects prediction (Step 12 Rule 1, sections 21 and 73)', () => {
        const predictions = [
            'You will lose your job next month.',
            'You are going to be fired.',
            'Your marriage will end if nothing changes.',
            'I predict the company closes the office.',
            'This will happen regardless of what you do.',
            'You are destined to move abroad.',
        ];
        it.each(predictions)('flags %j', (text) => {
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)(text)).toBe(true);
        });
    });
    describe('rejects fatalism (Step 19 section 10)', () => {
        const fatalistic = [
            'There is nothing you can do about it.',
            'This cannot be avoided.',
            'There is no way out of the loan.',
            'It is your fate.',
        ];
        it.each(fatalistic)('flags %j', (text) => {
            const claims = (0, deterministic_language_guard_1.findDeterministicClaims)(text);
            expect(claims.map((claim) => claim.kind)).toContain(deterministic_language_guard_1.DeterministicClaimKind.FATALISM);
        });
    });
    describe('rejects dated certainty (Step 12 section 47)', () => {
        it('flags the specification\'s own example shape', () => {
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('Your manager will fire you on 18 October.')).toBe(true);
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('The restructuring will happen in October.')).toBe(true);
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('The consultation will end in March.')).toBe(true);
            expect((0, deterministic_language_guard_1.hasDeterministicClaim)('If the consultation concludes in March, here is what we would want ready.')).toBe(false);
        });
    });
    describe('permits ordinary scenario language', () => {
        const safe = [
            'Your employment continues while the company completes restructuring.',
            'Role or responsibilities materially change.',
            'Current employment ends.',
            'Another role or income option becomes available before a forced transition.',
            'If the company does reduce your role, here is what we would want ready.',
            'Keep increasing visibility and value.',
            'Make sure Option B is active before you need it.',
            'We will want your CV refreshed either way.',
            'This could go several ways, and preparation helps in all of them.',
            'A formal consultation would make this path more relevant.',
        ];
        it.each(safe)('allows %j', (text) => {
            expect((0, deterministic_language_guard_1.findDeterministicClaims)(text)).toEqual([]);
        });
    });
    describe('scanning nested structures', () => {
        it('finds a claim buried deep in an array of objects', () => {
            const response = {
                scenarios: [
                    { title: 'Stay in role', summary: 'Employment continues for now.' },
                    {
                        title: 'Transition out',
                        summary: 'The role ends.',
                        risks: ['You will lose your job in November.'],
                    },
                ],
            };
            const claims = (0, deterministic_language_guard_1.scanForDeterministicClaims)(response);
            expect(claims).toHaveLength(1);
            expect(claims[0].field).toBe('$.scenarios[1].risks[0]');
        });
        it('returns nothing for a clean response', () => {
            expect((0, deterministic_language_guard_1.scanForDeterministicClaims)({
                scenarios: [{ title: 'Stay', summary: 'Employment continues.' }],
                shared_preparation: ['Refresh the CV'],
            })).toEqual([]);
        });
        it('handles null, undefined and non-string leaves without throwing', () => {
            expect((0, deterministic_language_guard_1.findDeterministicClaims)(null)).toEqual([]);
            expect((0, deterministic_language_guard_1.findDeterministicClaims)(undefined)).toEqual([]);
            expect((0, deterministic_language_guard_1.scanForDeterministicClaims)({ a: 1, b: true, c: null, d: undefined })).toEqual([]);
        });
    });
    describe('probability labels', () => {
        it('accepts the qualitative vocabulary from Step 12 section 16', () => {
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('PRIMARY')).toBe(true);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('PLAUSIBLE')).toBe(true);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('SECONDARY')).toBe(true);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('CONTINGENCY')).toBe(true);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)(null)).toBe(true);
        });
        it('refuses anything containing a digit', () => {
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('72%')).toBe(false);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('PRIMARY_80')).toBe(false);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('0.7')).toBe(false);
        });
        it('refuses a word outside the approved vocabulary', () => {
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('LIKELY')).toBe(false);
            expect((0, deterministic_language_guard_1.isQualitativeProbabilityLabel)('PREDICTED')).toBe(false);
        });
    });
});
//# sourceMappingURL=deterministic-language.guard.spec.js.map