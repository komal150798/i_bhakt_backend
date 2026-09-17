import { DataSource, EntityManager, Repository } from 'typeorm';
import { ZunoMemory } from '../entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../entities/zuno-memory-candidate.entity';
import { ZunoMemoryEvidence } from '../entities/zuno-memory-evidence.entity';
import { ZunoMemoryConflict } from '../entities/zuno-memory-conflict.entity';
import { MemorySummaryGroup, MemoryValue } from '../entities/memory.types';
import { MemoryEvidenceRole, MemoryEvidenceType, MemoryFactuality, MemoryRejectionReason, MemoryRetentionClass, MemoryScope, MemorySource, MemoryStatus, MemoryType } from '../enums/memory.enum';
import { MemoryRetrievalQuery, MemoryRetrievalResult } from '../retrieval/memory-relevance';
import { ConfirmationReason } from './memory-policy';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { SafetyService } from '../../safety/services/safety.service';
export interface ProposeCandidateParams {
    userId: string;
    challengeId?: string | null;
    type: MemoryType;
    key: string;
    value: MemoryValue;
    source: MemorySource;
    evidenceType: MemoryEvidenceType;
    confidence: number;
    factuality?: MemoryFactuality;
    sourceEventId?: string | null;
    retentionClass?: MemoryRetentionClass;
    evidence?: {
        sourceEntityType: string;
        sourceEntityId: string;
        role?: MemoryEvidenceRole;
        observedAt?: Date;
    }[];
    evidenceCount?: number;
}
export interface ProposeCandidateResult {
    candidate: ZunoMemoryCandidate | null;
    memory: ZunoMemory | null;
    rejectedReason: MemoryRejectionReason | null;
    confirmationReason: ConfirmationReason | null;
    merged: boolean;
}
export interface RetrieveParams extends Omit<MemoryRetrievalQuery, 'now'> {
    now?: Date;
}
export interface CorrectMemoryParams {
    userId: string;
    memoryId: string;
    statement: string;
    label?: string;
    expectedVersion?: number;
}
export declare class MemoryService {
    private readonly memories;
    private readonly candidates;
    private readonly evidence;
    private readonly conflicts;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(memories: Repository<ZunoMemory>, candidates: Repository<ZunoMemoryCandidate>, evidence: Repository<ZunoMemoryEvidence>, conflicts: Repository<ZunoMemoryConflict>, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    proposeCandidate(params: ProposeCandidateParams): Promise<ProposeCandidateResult>;
    confirmCandidate(userId: string, candidateId: string): Promise<ZunoMemory>;
    rejectCandidate(userId: string, candidateId: string, reason?: MemoryRejectionReason): Promise<ZunoMemoryCandidate>;
    retrieve(params: RetrieveParams): Promise<MemoryRetrievalResult>;
    summaryForUser(userId: string): Promise<MemorySummaryGroup[]>;
    listForUser(userId: string, filters?: {
        type?: MemoryType;
        challengeId?: string;
        scope?: MemoryScope;
    }): Promise<ZunoMemory[]>;
    pendingCandidates(userId: string): Promise<ZunoMemoryCandidate[]>;
    findOwned(userId: string, memoryId: string): Promise<ZunoMemory>;
    correct(params: CorrectMemoryParams): Promise<ZunoMemory>;
    supersede(manager: EntityManager, incumbent: ZunoMemory, replacement: ZunoMemory, now: Date): Promise<{
        superseded: boolean;
    }>;
    supersessionChain(userId: string, memoryId: string): Promise<ZunoMemory[]>;
    expireDue(options?: {
        userId?: string;
        now?: Date;
    }): Promise<number>;
    closeChallengeMemory(userId: string, challengeId: string): Promise<number>;
    deleteMemory(userId: string, memoryId: string, reason?: string): Promise<void>;
    deleteChallengeMemory(userId: string, challengeId: string): Promise<number>;
    private writeMemory;
    private markSuperseded;
    private recordConfirmation;
    private evidenceRow;
    private recordConflict;
    private findActiveByKey;
    countByStatus(userId: string, statuses: MemoryStatus[]): Promise<number>;
}
export declare function whyItMatters(memory: ZunoMemory): string;
