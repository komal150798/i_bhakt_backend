"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const future_self_boundary_1 = require("./future-self-boundary");
const future_self_enum_1 = require("../enums/future-self.enum");
describe('Future Self boundary (roadmap section 71)', () => {
    const grounding = (0, future_self_boundary_1.buildGroundingSet)([
        {
            entityType: 'ZunoChallenge',
            entityId: 'ch-1',
            text: 'Career uncertainty in Dubai with home loan exposure and restructuring at the current employer.',
        },
        {
            entityType: 'ZunoMemory',
            entityId: 'mem-1',
            text: 'Will not resign before another offer is secured.',
        },
        {
            entityType: 'ZunoMemory',
            entityId: 'mem-2',
            text: 'CV updated and loan terms clarified with the bank.',
        },
        {
            entityType: 'ZunoPlanItem',
            entityId: 'pi-1',
            text: 'Prepare questions for the bank consultation.',
        },
    ]);
    function check(text, mode = future_self_enum_1.FutureSelfMode.WEEKLY) {
        return (0, future_self_boundary_1.checkFutureSelfBoundary)({
            mode,
            candidateText: text,
            summary: text,
            grounding,
        });
    }
    describe('grounded narratives are allowed', () => {
        it('allows the Step 18 section 99 worked example', () => {
            const result = check('We started this challenge feeling as though one company decision could control everything. Since then we have clarified the loan terms with the bank and updated the CV. The uncertainty has not disappeared, but our dependence on one outcome has reduced. This week our job is to keep strengthening that position.');
            expect(result.violations).toEqual([]);
            expect(result.allowed).toBe(true);
        });
        it('allows a grounded reference to Dubai, because the challenge names it', () => {
            const result = check('Staying in Dubai while employment is stable is still the decision we made, and nothing this week changes it.');
            expect(result.allowed).toBe(true);
        });
        it('allows a careful statement about an uncertain future', () => {
            const result = check('We do not know what the company will decide. What we can do is make sure we are prepared either way, which is what the updated CV is for.');
            expect(result.allowed).toBe(true);
        });
        it('allows an observation phrased as an observation, not an identity', () => {
            const result = check('We have postponed the bank conversation a couple of times. Would a smaller first step make it easier?');
            expect(result.allowed).toBe(true);
        });
    });
    describe('invented future employer', () => {
        it('refuses a named employer the user never mentioned', () => {
            const result = check('Our preparation is paying off. By next quarter we will be settled at Emirates Global Logistics, and the loan pressure will ease.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_EMPLOYER);
        });
        it('refuses a fabricated recruiter or company in an offer construction', () => {
            const result = check('The offer from Meridian Consulting shows how much the network work mattered.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_EMPLOYER);
        });
        it('refuses an invented employer even at the start of a sentence', () => {
            const result = check('Zenith Systems will call us back this week, so we should be ready.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_EMPLOYER);
        });
        it('catches the invention even when the sentence is otherwise cautious', () => {
            const result = check('We cannot know how things will go, though the conversation with Halcyon Partners is a good sign.');
            expect(result.allowed).toBe(false);
            expect(result.violations.length).toBeGreaterThan(0);
        });
    });
    describe('invented future partner', () => {
        it('refuses a named future partner', () => {
            const result = check('In a year from now we will be settled, and marrying Priya Sharma will feel like the obvious next step.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_PARTNER);
        });
        it('refuses an invented spouse reference', () => {
            const result = check('Our partner Anjali has been patient through all of this, and that patience is part of what steadied us.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_PARTNER);
        });
    });
    describe('invented future salary', () => {
        it('refuses an invented package figure', () => {
            const result = check('The role we are preparing for pays around AED 45,000 a month, which would clear the loan comfortably.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY);
        });
        it('refuses an invented raise percentage', () => {
            const result = check('This preparation should be worth a 30% raise when the conversation happens.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY);
        });
        it('refuses an Indian-notation figure the record never contained', () => {
            const result = check('A package of 24 lakh is well within reach given what we have built.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY);
        });
        it('allows a figure that the user actually recorded', () => {
            const withFigure = (0, future_self_boundary_1.buildGroundingSet)([
                {
                    entityType: 'ZunoMemory',
                    entityId: 'mem-3',
                    text: 'Monthly loan EMI is AED 9,500.',
                },
            ]);
            const result = (0, future_self_boundary_1.checkFutureSelfBoundary)({
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
                candidateText: 'The AED 9,500 commitment is the number every option has to clear.',
                summary: 'x',
                grounding: withFigure,
            });
            expect(result.violations).not.toContain(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY);
        });
    });
    describe('guaranteed outcome', () => {
        const cases = [
            ['explicit promise', 'I know that you will keep your job.'],
            ['blanket reassurance', 'Trust me, everything works out.'],
            ['guarantee wording', 'This preparation is guaranteed to pay off.'],
            ['definite future', 'You will definitely land the role we prepared for.'],
            ['dated promise', 'By March you will have another offer in hand.'],
            ['safety promise', 'Do not worry - your job is safe.'],
            ['going-to construction', 'We are going to get the outcome we want.'],
            ['no-doubt construction', 'There is no doubt that you will come through this.'],
        ];
        it.each(cases)('refuses a %s', (_label, text) => {
            const result = check(text);
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.GUARANTEED_OUTCOME);
        });
    });
    describe('literal future knowledge', () => {
        it('refuses the Step 18 section 112 anti-pattern verbatim', () => {
            const result = check('I am you in December 2026, and I can tell you this settles down.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.LITERAL_FUTURE_KNOWLEDGE);
        });
        it('refuses a claim to have seen the future', () => {
            const result = check('I have seen your future and it is a good one.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.LITERAL_FUTURE_KNOWLEDGE);
        });
    });
    describe('supporting boundaries', () => {
        it('refuses karma or planetary causation', () => {
            const result = check('Because your karma improved, the pressure at work has started to lift.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.MYSTICAL_CAUSATION);
        });
        it('refuses an unevidenced claim that the user is calmer', () => {
            const result = check('You are much calmer now than you were a month ago.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.UNGROUNDED_EMOTIONAL_CLAIM);
        });
        it('allows the same claim when the user said it themselves', () => {
            const withSelfReport = (0, future_self_boundary_1.buildGroundingSet)([
                {
                    entityType: 'ZunoMemory',
                    entityId: 'mem-4',
                    text: 'Says they feel calmer since the bank conversation.',
                },
            ]);
            const result = (0, future_self_boundary_1.checkFutureSelfBoundary)({
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
                candidateText: 'You are calmer since the bank conversation, in your own words.',
                summary: 'x',
                grounding: withSelfReport,
            });
            expect(result.violations).not.toContain(future_self_enum_1.FutureSelfViolation.UNGROUNDED_EMOTIONAL_CLAIM);
        });
        it('refuses a fixed identity label', () => {
            const result = check('You always avoid difficult conversations.');
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.IDENTITY_LABEL);
        });
        it('refuses a source reference that was never supplied', () => {
            const result = (0, future_self_boundary_1.checkFutureSelfBoundary)({
                mode: future_self_enum_1.FutureSelfMode.WEEKLY,
                candidateText: 'We updated the CV.',
                summary: 'We updated the CV.',
                grounding,
                claimedSourceRefs: ['ZunoMemory:mem-2', 'ZunoMemory:mem-does-not-exist'],
            });
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.UNVERIFIABLE_SOURCE);
        });
        it('enforces the daily mode length ceiling', () => {
            const long = 'We updated the CV and clarified the loan terms. '.repeat(20);
            const result = (0, future_self_boundary_1.checkFutureSelfBoundary)({
                mode: future_self_enum_1.FutureSelfMode.DAILY,
                candidateText: long,
                summary: long,
                grounding,
            });
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.MODE_LENGTH_EXCEEDED);
        });
        it('reports every violation rather than stopping at the first', () => {
            const result = check('I am you from the future. You will definitely be hired at Northwind Labs on AED 40,000 a month.');
            expect(result.violations.length).toBeGreaterThanOrEqual(3);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.LITERAL_FUTURE_KNOWLEDGE);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.GUARANTEED_OUTCOME);
            expect(result.violations).toContain(future_self_enum_1.FutureSelfViolation.INVENTED_SALARY);
        });
    });
});
//# sourceMappingURL=future-self-boundary.spec.js.map