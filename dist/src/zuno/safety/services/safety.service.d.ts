import { EntityManager } from 'typeorm';
import { ZunoSafetyDecision } from '../entities/zuno-safety-decision.entity';
import { ZunoSafetyIncident } from '../entities/zuno-safety-incident.entity';
import { SafetySignalDetector } from './safety-signal-detector';
import { SafetyAction, SafetyBlockedCapability, SafetyDisposition, SafetyFlag, SafetyViolation, ZunoDomain, ZunoRiskClass } from '../../common/enums';
export interface SafetyPreCheckInput {
    operation: string;
    userId: string;
    challengeId?: string | null;
    text: string;
    domains?: ZunoDomain[];
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
    blocked: boolean;
    astrologySuppressed: boolean;
}
export interface SafetyPostCheckInput {
    userId: string;
    challengeId?: string | null;
    safetyDecisionId?: string | null;
    responseId?: string | null;
    candidateText: string;
    assessment: SafetyAssessment;
}
export interface SafetyPostCheckResult {
    allowed: boolean;
    rewriteRequired: boolean;
    violations: SafetyViolation[];
}
export declare class SafetyService {
    private readonly detector;
    private readonly logger;
    constructor(detector: SafetySignalDetector);
    preCheck(input: SafetyPreCheckInput): SafetyAssessment;
    refineWithDomains(previous: SafetyAssessment, input: Omit<SafetyPreCheckInput, 'modelFlags'> & {
        modelFlags?: SafetyFlag[];
    }): SafetyAssessment;
    postCheck(input: SafetyPostCheckInput): SafetyPostCheckResult;
    recordDecision(manager: EntityManager, params: {
        userId: string;
        challengeId?: string | null;
        operation: string;
        assessment: SafetyAssessment;
    }): Promise<ZunoSafetyDecision>;
    recordIncident(manager: EntityManager, params: {
        userId?: string | null;
        safetyDecisionId?: string | null;
        responseId?: string | null;
        source: string;
        domain?: ZunoDomain | null;
        severity: ZunoRiskClass;
        violations: SafetyViolation[];
    }): Promise<ZunoSafetyIncident>;
    hasCriticalFlag(flags: SafetyFlag[]): boolean;
    private matchRules;
    private worseRisk;
    private worseDisposition;
}
