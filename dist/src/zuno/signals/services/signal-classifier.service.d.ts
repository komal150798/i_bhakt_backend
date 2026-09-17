import { ZunoDomain } from '../../common/enums';
import { LifeSignalMateriality, LifeSignalNature, LifeSignalOrigin, LifeSignalRelevance, LifeSignalReliability, LifeSignalSource, LifeSignalType, RealignmentReasonCode, UrgencyChange } from '../enums';
export declare const SIGNAL_DETECTOR_VERSION = "signal-classifier@1.0.0";
export interface ClassifyInput {
    statement: string;
    declaredType: LifeSignalType | null;
    source: LifeSignalSource;
    origin: LifeSignalOrigin;
    domain: ZunoDomain | null;
    challengeDomains: ZunoDomain[];
    occurredAt: Date | null;
    detectedAt: Date;
}
export interface Classification {
    isCandidateSignal: boolean;
    noiseReason: string | null;
    signalType: LifeSignalType;
    nature: LifeSignalNature;
    normalizedEvent: string;
    reliability: LifeSignalReliability;
    isInference: boolean;
    confidence: number;
    materiality: LifeSignalMateriality;
    relevance: LifeSignalRelevance;
    urgencyChange: UrgencyChange;
    clarificationRequired: boolean;
    reasonCodes: RealignmentReasonCode[];
    staleAfter: Date | null;
    fingerprint: string;
    requiresRulebook: boolean;
}
export declare class SignalClassifierService {
    classify(input: ClassifyInput): Classification;
    fingerprintFor(signalType: LifeSignalType, normalizedEvent: string, at: Date): string;
    private noiseReason;
    private noiseResult;
    private isHedged;
    private isExplicit;
    private inferType;
    private inferNature;
    private inferReliability;
    private scoreConfidence;
    private scoreRelevance;
    private scoreUrgencyChange;
    private scoreMateriality;
    private reasonCodes;
    private staleAfter;
    private normalizeEvent;
    private fingerprint;
}
