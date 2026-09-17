"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const safety_service_1 = require("./safety.service");
const safety_signal_detector_1 = require("./safety-signal-detector");
const enums_1 = require("../../common/enums");
describe('SafetyService', () => {
    let service;
    beforeEach(() => {
        service = new safety_service_1.SafetyService(new safety_signal_detector_1.SafetySignalDetector());
    });
    const base = { operation: 'TEST', userId: 'user-1', challengeId: null };
    describe('critical safety detection', () => {
        it('blocks and escalates on a self-harm signal', () => {
            const result = service.preCheck({
                ...base,
                text: 'I do not want to live anymore, there is no point',
                domains: [enums_1.ZunoDomain.PERSONAL_GROWTH],
            });
            expect(result.flags).toContain(enums_1.SafetyFlag.SELF_HARM);
            expect(result.disposition).toBe(enums_1.SafetyDisposition.CRITICAL_ESCALATION);
            expect(result.riskLevel).toBe(enums_1.ZunoRiskClass.CRITICAL_SAFETY);
            expect(result.blocked).toBe(true);
            expect(result.astrologySuppressed).toBe(true);
        });
        it('detects abuse and suppresses astrology', () => {
            const result = service.preCheck({
                ...base,
                text: 'My husband hits me and I am afraid for my safety',
                domains: [enums_1.ZunoDomain.MARRIAGE],
            });
            expect(result.flags).toContain(enums_1.SafetyFlag.ABUSE);
            expect(result.astrologySuppressed).toBe(true);
            expect(result.actions).toContain(enums_1.SafetyAction.ESCALATE_CRITICAL);
        });
        it('runs deterministically without any model involvement', () => {
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
                domains: [enums_1.ZunoDomain.FAMILY],
            });
            expect(result.flags).toHaveLength(0);
        });
    });
    describe('high-stakes domain boundaries', () => {
        it('requires a professional boundary for immigration questions', () => {
            const result = service.preCheck({
                ...base,
                text: 'Will I be able to stay in the country if I lose my job?',
                domains: [enums_1.ZunoDomain.CAREER, enums_1.ZunoDomain.FOREIGN_RESIDENCE],
            });
            expect(result.disposition).toBe(enums_1.SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED);
            expect(result.actions).toContain(enums_1.SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY);
            expect(result.blockedCapabilities).toContain(enums_1.SafetyBlockedCapability.GUARANTEED_LEGAL_OUTCOME);
            expect(result.boundaryMessage).toBeDefined();
        });
        it('takes the most restrictive disposition across mixed domains', () => {
            const careerOnly = service.preCheck({
                ...base,
                text: 'Thinking about my next role',
                domains: [enums_1.ZunoDomain.CAREER],
            });
            const mixed = service.preCheck({
                ...base,
                text: 'Thinking about my next role',
                domains: [enums_1.ZunoDomain.CAREER, enums_1.ZunoDomain.FOREIGN_RESIDENCE],
            });
            expect(careerOnly.disposition).toBe(enums_1.SafetyDisposition.ALLOW_WITH_BOUNDARY);
            expect(mixed.disposition).toBe(enums_1.SafetyDisposition.PROFESSIONAL_SUPPORT_REQUIRED);
            expect(mixed.riskLevel).toBe(enums_1.ZunoRiskClass.HIGH_STAKES);
        });
        it('suppresses astrology entirely for health questions', () => {
            const result = service.preCheck({
                ...base,
                text: 'I have been unwell and I am worried',
                domains: [enums_1.ZunoDomain.HEALTH_WELLBEING],
            });
            expect(result.astrologySuppressed).toBe(true);
            expect(result.blockedCapabilities).toContain(enums_1.SafetyBlockedCapability.ASTROLOGY_REMEDY);
        });
        it('escalates finance to high stakes on a severe financial signal', () => {
            const result = service.preCheck({
                ...base,
                text: 'I cannot pay my mortgage and I may lose my home',
                domains: [enums_1.ZunoDomain.FINANCE],
            });
            expect(result.flags).toContain(enums_1.SafetyFlag.SEVERE_FINANCIAL_RISK);
            expect(result.riskLevel).toBe(enums_1.ZunoRiskClass.HIGH_STAKES);
        });
    });
    describe('model-supplied flags', () => {
        it('accepts a flag the deterministic detector missed', () => {
            const result = service.preCheck({
                ...base,
                text: 'something the patterns do not cover',
                domains: [enums_1.ZunoDomain.LEGAL],
                modelFlags: [enums_1.SafetyFlag.SERIOUS_LEGAL_RISK],
            });
            expect(result.flags).toContain(enums_1.SafetyFlag.SERIOUS_LEGAL_RISK);
        });
        it('cannot be talked down by a model that reports nothing', () => {
            const result = service.preCheck({
                ...base,
                text: 'I want to end my life',
                domains: [],
                modelFlags: [],
            });
            expect(result.flags).toContain(enums_1.SafetyFlag.SELF_HARM);
            expect(result.blocked).toBe(true);
        });
    });
    describe('refineWithDomains', () => {
        it('carries earlier flags into the second pass', () => {
            const first = service.preCheck({
                ...base,
                text: 'I cannot pay my loan',
                domains: [],
            });
            const second = service.refineWithDomains(first, {
                ...base,
                text: 'I cannot pay my loan',
                domains: [enums_1.ZunoDomain.FINANCE, enums_1.ZunoDomain.FOREIGN_RESIDENCE],
            });
            expect(second.flags).toContain(enums_1.SafetyFlag.SEVERE_FINANCIAL_RISK);
            expect(second.riskLevel).toBe(enums_1.ZunoRiskClass.HIGH_STAKES);
        });
    });
    describe('post-check', () => {
        const allowAssessment = {
            riskLevel: enums_1.ZunoRiskClass.MODERATE_RISK,
            disposition: enums_1.SafetyDisposition.ALLOW_WITH_BOUNDARY,
            domains: [enums_1.ZunoDomain.CAREER],
            flags: [],
            actions: [enums_1.SafetyAction.ALLOW_GENERAL_GUIDANCE],
            blockedCapabilities: [enums_1.SafetyBlockedCapability.DETERMINISTIC_PREDICTION],
            matchedRuleIds: ['SAFE-CAR-001'],
            policyVersion: '1.0',
            blocked: false,
            astrologySuppressed: false,
        };
        it('blocks unsupported certainty', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'You will definitely lose your job in December.',
                assessment: allowAssessment,
            });
            expect(result.allowed).toBe(false);
            expect(result.violations).toContain(enums_1.SafetyViolation.UNSUPPORTED_CERTAINTY);
        });
        it('blocks fatalism', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'This is your fate and it cannot be avoided.',
                assessment: allowAssessment,
            });
            expect(result.violations).toContain(enums_1.SafetyViolation.FATALISM);
        });
        it('blocks fear amplification', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'Act now, before it is too late, or this will be a disaster.',
                assessment: allowAssessment,
            });
            expect(result.violations).toContain(enums_1.SafetyViolation.FEAR_AMPLIFICATION);
        });
        it('allows properly hedged language', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'This period shows more uncertainty than usual, so preparing now is worthwhile. Nothing here is settled.',
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
                        enums_1.SafetyAction.ALLOW_GENERAL_GUIDANCE,
                        enums_1.SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
                    ],
                },
            });
            expect(result.violations).toContain(enums_1.SafetyViolation.PROFESSIONAL_BOUNDARY_VIOLATION);
        });
        it('accepts output that includes the required boundary', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'We can prepare your questions, though the current rules are worth confirming with a qualified immigration adviser.',
                assessment: {
                    ...allowAssessment,
                    actions: [
                        enums_1.SafetyAction.ALLOW_GENERAL_GUIDANCE,
                        enums_1.SafetyAction.REQUIRE_PROFESSIONAL_BOUNDARY,
                    ],
                },
            });
            expect(result.allowed).toBe(true);
        });
        it('blocks ungrounded remedy language when astrology is suppressed', () => {
            const result = service.postCheck({
                userId: 'u1',
                candidateText: 'You should wear a yellow gemstone and chant daily.',
                assessment: {
                    ...allowAssessment,
                    blockedCapabilities: [enums_1.SafetyBlockedCapability.ASTROLOGY_REMEDY],
                },
            });
            expect(result.violations).toContain(enums_1.SafetyViolation.UNSAFE_REMEDY);
            expect(result.rewriteRequired).toBe(true);
        });
    });
});
//# sourceMappingURL=safety.service.spec.js.map