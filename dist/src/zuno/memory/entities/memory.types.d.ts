import { MemoryType } from '../enums/memory.enum';
export interface MemoryValue {
    statement: string;
    label?: string;
    refs?: {
        entity_type: string;
        entity_id: string;
    }[];
    rulebook?: {
        rulebook_version_id?: string;
        rule_ids?: string[];
        interpretation_id?: string;
    };
    detail?: Record<string, string | number | boolean | null>;
}
export interface MemoryCandidateProposal {
    type: MemoryType;
    key: string;
    value: MemoryValue;
    confidence: number;
    sourceEventId?: string | null;
}
export interface MemorySummaryGroup {
    type: MemoryType;
    label: string;
    items: {
        id: string;
        statement: string;
        scope: string;
        challengeId: string | null;
        why: string;
        lastConfirmedAt: string | null;
        expiresAt: string | null;
    }[];
}
