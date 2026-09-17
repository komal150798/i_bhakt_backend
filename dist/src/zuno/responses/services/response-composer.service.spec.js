"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_composer_service_1 = require("./response-composer.service");
const enums_1 = require("../../common/enums");
describe('ResponseComposerService', () => {
    const composer = new response_composer_service_1.ResponseComposerService();
    const allowSafety = {
        riskLevel: enums_1.ZunoRiskClass.MODERATE_RISK,
        disposition: enums_1.SafetyDisposition.ALLOW_WITH_BOUNDARY,
        domains: [enums_1.ZunoDomain.CAREER],
        flags: [],
        actions: [enums_1.SafetyAction.ALLOW_GENERAL_GUIDANCE],
        blockedCapabilities: [],
        matchedRuleIds: ['SAFE-CAR-001'],
        policyVersion: '1.0',
        blocked: false,
        astrologySuppressed: false,
    };
    function context(overrides = {}) {
        return {
            summary: 'Your job and your loan are tied together right now.',
            items: [
                {
                    id: '1',
                    text: 'Layoffs are occurring at the employer',
                    type: enums_1.ContextItemType.FACT,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.95,
                },
                {
                    id: '2',
                    text: 'They may lose their job',
                    type: enums_1.ContextItemType.FEAR,
                    source: enums_1.ContextItemSource.USER_STATED,
                    confidence: 0.97,
                },
            ],
            dependencies: [
                {
                    id: 'd1',
                    from: 'Employment',
                    to: 'Income',
                    source: enums_1.ContextItemSource.USER_STATED,
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
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        const section = payload.sections.find((s) => s.type === enums_1.ResponseSectionType.CONTEXT_VALIDATION);
        const validation = section.payload;
        expect(validation.understood).toContain('Layoffs are occurring at the employer');
        expect(validation.understood).not.toContain('They may lose their job');
        expect(validation.concerns).toContain('They may lose their job');
    });
    it('invites correction', () => {
        const payload = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        const validation = payload.sections[0].payload;
        expect(validation.correction_invited).toBe(true);
    });
    it('varies the number of sections rather than emitting a fixed set', () => {
        const rich = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        const sparse = composer.compose({
            context: context({
                dependencies: [],
                factors: { controllable: [], external: [] },
            }),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        expect(rich.sections.length).toBeGreaterThan(sparse.sections.length);
        expect(sparse.sections).toHaveLength(1);
    });
    it('caps focus priorities and draws them only from controllable factors', () => {
        const payload = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        const section = payload.sections.find((s) => s.type === enums_1.ResponseSectionType.FOCUS_PRIORITIES);
        const priorities = section.payload.priorities;
        expect(priorities.length).toBeLessThanOrEqual(3);
        expect(priorities.map((p) => p.title)).not.toContain('Employer decisions');
    });
    it('shows less when the person is under strain', () => {
        const quick = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.QUICK,
            safety: allowSafety,
        });
        const standard = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
            safety: allowSafety,
        });
        const quickPriorities = quick.sections.find((s) => s.type === enums_1.ResponseSectionType.FOCUS_PRIORITIES)
            .payload.priorities;
        const standardPriorities = standard.sections.find((s) => s.type === enums_1.ResponseSectionType.FOCUS_PRIORITIES).payload.priorities;
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
            const payload = composer.compose({
                context: clarifying,
                clarificationRequired: true,
                responseDepth: enums_1.ResponseDepth.STANDARD,
                safety: allowSafety,
            });
            expect(payload.sections[0].type).toBe(enums_1.ResponseSectionType.CONTEXT_VALIDATION);
            expect(payload.sections[1].type).toBe(enums_1.ResponseSectionType.CLARIFICATION);
        });
        it('asks at most two questions', () => {
            const payload = composer.compose({
                context: clarifying,
                clarificationRequired: true,
                responseDepth: enums_1.ResponseDepth.STANDARD,
                safety: allowSafety,
            });
            const questions = payload.sections[1].payload.questions;
            expect(questions.length).toBeLessThanOrEqual(2);
        });
        it('does not offer priorities on an admittedly incomplete understanding', () => {
            const payload = composer.compose({
                context: clarifying,
                clarificationRequired: true,
                responseDepth: enums_1.ResponseDepth.STANDARD,
                safety: allowSafety,
            });
            expect(payload.sections.some((s) => s.type === enums_1.ResponseSectionType.FOCUS_PRIORITIES)).toBe(false);
        });
    });
    describe('safety shaping', () => {
        it('replaces the whole response when safety blocks', () => {
            const payload = composer.compose({
                context: context(),
                clarificationRequired: false,
                responseDepth: enums_1.ResponseDepth.STANDARD,
                safety: {
                    ...allowSafety,
                    blocked: true,
                    disposition: enums_1.SafetyDisposition.CRITICAL_ESCALATION,
                    riskLevel: enums_1.ZunoRiskClass.CRITICAL_SAFETY,
                },
            });
            expect(payload.sections).toHaveLength(1);
            expect(payload.sections[0].type).toBe(enums_1.ResponseSectionType.SAFETY_BOUNDARY);
        });
        it('appends a boundary without withholding the useful part', () => {
            const payload = composer.compose({
                context: context(),
                clarificationRequired: false,
                responseDepth: enums_1.ResponseDepth.STANDARD,
                safety: {
                    ...allowSafety,
                    disposition: enums_1.SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED,
                    boundaryMessage: 'I should not present the outcome as certain.',
                    suggestedSupport: 'a qualified legal professional',
                    actions: [
                        enums_1.SafetyAction.ALLOW_GENERAL_GUIDANCE,
                        enums_1.SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
                    ],
                    blockedCapabilities: [enums_1.SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME],
                },
            });
            expect(payload.sections.some((s) => s.type === enums_1.ResponseSectionType.CONTEXT_VALIDATION)).toBe(true);
            const boundary = payload.sections.find((s) => s.type === enums_1.ResponseSectionType.SAFETY_BOUNDARY);
            expect(boundary).toBeDefined();
            expect(boundary.order).toBe(payload.sections.length);
        });
    });
    it('returns content structure only, never layout instructions', () => {
        const payload = composer.compose({
            context: context(),
            clarificationRequired: false,
            responseDepth: enums_1.ResponseDepth.STANDARD,
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
//# sourceMappingURL=response-composer.service.spec.js.map