import { ZunoMemory } from '../entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../entities/zuno-memory-candidate.entity';
import { MemoryScope, MemoryType } from '../enums/memory.enum';
export declare class ListMemoryQueryDto {
    type?: MemoryType;
    challengeId?: string;
    scope?: MemoryScope;
}
export declare class CorrectMemoryDto {
    statement: string;
    label?: string;
    version?: number;
}
export declare class RejectCandidateDto {
    note?: string;
}
export declare class MemoryView {
    id: string;
    type: MemoryType;
    label: string;
    value: string;
    scope: MemoryScope;
    challengeId: string | null;
    why: string;
    expiresAt: string | null;
    version: number;
    static from(memory: ZunoMemory, why: string): MemoryView;
}
export declare class MemoryCandidateView {
    id: string;
    type: MemoryType;
    proposed: string;
    challengeId: string | null;
    askingBecause: string;
    static from(candidate: ZunoMemoryCandidate): MemoryCandidateView;
}
export declare class MemorySummaryView {
    type: string;
    label: string;
    items: unknown[];
}
