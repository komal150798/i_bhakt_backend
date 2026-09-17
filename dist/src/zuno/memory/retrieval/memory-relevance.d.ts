import { ZunoMemory } from '../entities/zuno-memory.entity';
import { MemoryFactuality, MemoryRequestContext, MemorySensitivity, MemoryStatus, MemoryType } from '../enums/memory.enum';
export declare const DEFAULT_MAX_MEMORY_ITEMS = 12;
export declare const MAX_MEMORY_ITEMS_CEILING = 25;
export declare const DEFAULT_MEMORY_CHAR_BUDGET = 1600;
export declare const DEFAULT_MIN_RELEVANCE_SCORE = 0.35;
export declare const MEMORY_CONFIDENCE_FLOOR = 0.3;
export declare const RELEVANCE_WEIGHTS: Readonly<{
    purpose: 0.3;
    scope: 0.2;
    authority: 0.15;
    importance: 0.15;
    confidence: 0.1;
    recency: 0.1;
}>;
export declare const PURPOSE_TYPE_PRIORITY: Readonly<Record<MemoryRequestContext, readonly MemoryType[]>>;
export interface MemoryRetrievalQuery {
    userId: string;
    requestContext: MemoryRequestContext;
    challengeId?: string | null;
    closedChallengeIds?: readonly string[];
    memoryTypes?: readonly MemoryType[];
    maxItems?: number;
    charBudget?: number;
    minScore?: number;
    maxSensitivity?: MemorySensitivity;
    includeFactualities?: readonly MemoryFactuality[];
    queryTerms?: readonly string[];
    now?: Date;
}
export interface ScoredMemory {
    memory: ZunoMemory;
    score: number;
    factors: {
        purpose: number;
        scope: number;
        authority: number;
        importance: number;
        confidence: number;
        recency: number;
        lexical: number;
    };
}
export interface MemoryRetrievalResult {
    items: ScoredMemory[];
    consideredCount: number;
    droppedCount: number;
    charBudgetUsed: number;
}
export type InadmissibleReason = 'NOT_OWNED' | 'NOT_ACTIVE' | 'REDACTED' | 'SOFT_DELETED' | 'EXPIRED' | 'NON_FACTUAL' | 'TOO_SENSITIVE' | 'OTHER_CHALLENGE' | 'CLOSED_CHALLENGE' | 'TYPE_NOT_REQUESTED' | 'BELOW_CONFIDENCE_FLOOR';
export declare function admissibility(memory: ZunoMemory, query: MemoryRetrievalQuery, now: Date): InadmissibleReason | null;
export declare function scoreMemory(memory: ZunoMemory, query: MemoryRetrievalQuery, now: Date): ScoredMemory;
export declare function selectRelevantMemories(memories: readonly ZunoMemory[], query: MemoryRetrievalQuery): MemoryRetrievalResult;
export declare function purposeScore(type: MemoryType, requestContext: MemoryRequestContext): number;
export declare function recencyScore(memory: ZunoMemory, now: Date): number;
export declare const RETRIEVABLE_STATUSES: readonly MemoryStatus[];
export declare const ACTIVE_STATUS = MemoryStatus.ACTIVE;
