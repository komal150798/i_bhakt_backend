import { MemoryEvidenceType, MemoryFactuality, MemoryRejectionReason, MemoryRetentionClass, MemorySensitivity, MemorySource, MemoryType } from '../enums/memory.enum';
export interface WorthinessInput {
    type: MemoryType;
    statement: string;
    evidenceType: MemoryEvidenceType;
    confidence: number;
    factuality: MemoryFactuality;
    evidenceCount?: number;
}
export type WorthinessVerdict = {
    worth: true;
} | {
    worth: false;
    reason: MemoryRejectionReason;
};
export declare function isUnworthy(verdict: WorthinessVerdict): verdict is {
    worth: false;
    reason: MemoryRejectionReason;
};
export declare function assessWorthiness(input: WorthinessInput): WorthinessVerdict;
export declare const MIN_PATTERN_EVIDENCE = 3;
export declare const INFERENCE_AUTO_ACCEPT_CONFIDENCE = 0.85;
export type ConfirmationReason = 'LOW_CONFIDENCE_INFERENCE' | 'SENSITIVE_CLASSIFICATION' | 'CONTRADICTS_ACTIVE_MEMORY' | 'DERIVED_PATTERN';
export declare function confirmationRequirement(input: {
    evidenceType: MemoryEvidenceType;
    confidence: number;
    sensitivity: MemorySensitivity;
    type: MemoryType;
    conflictsWithActive: boolean;
    source: MemorySource;
}): ConfirmationReason | null;
export declare function classifySensitivity(type: MemoryType, statement: string): MemorySensitivity;
export declare function defaultRetention(type: MemoryType, factuality: MemoryFactuality): MemoryRetentionClass;
export declare function defaultExpiryDays(retention: MemoryRetentionClass): number | null;
export declare function contradicts(incumbent: {
    memory_key: string;
    factuality: MemoryFactuality;
}, incoming: {
    memory_key: string;
    factuality: MemoryFactuality;
}): boolean;
