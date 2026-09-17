import { DataSource, Repository } from 'typeorm';
import { IFutureSelfEngine } from '../engines/future-self.port';
import { IPlanProgressProvider } from '../ports/plan-progress.port';
import { ZunoFutureSelfNarrative } from '../entities/zuno-future-self-narrative.entity';
import { ZunoFutureSelfSource } from '../entities/zuno-future-self-source.entity';
import { FutureSelfMode } from '../enums/future-self.enum';
import { MemoryService } from '../../memory/services/memory.service';
import { MemoryRequestContext, MemoryType } from '../../memory/enums/memory.enum';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
export declare const FUTURE_SELF_BOUNDARY_VERSION = "fs-boundary-1.0.0";
export interface GenerateFutureSelfParams {
    userId: string;
    challengeId?: string | null;
    mode: FutureSelfMode;
}
export interface GenerateFutureSelfResult {
    narrative: ZunoFutureSelfNarrative;
    sources: ZunoFutureSelfSource[];
}
export declare class FutureSelfService {
    private readonly engine;
    private readonly planProgress;
    private readonly narratives;
    private readonly challenges;
    private readonly contexts;
    private readonly memory;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly rulebook?;
    private readonly logger;
    constructor(engine: IFutureSelfEngine, planProgress: IPlanProgressProvider, narratives: Repository<ZunoFutureSelfNarrative>, challenges: Repository<ZunoChallenge>, contexts: Repository<ZunoChallengeContext>, memory: MemoryService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource, rulebook?: RulebookRepositoryService);
    generate(params: GenerateFutureSelfParams): Promise<GenerateFutureSelfResult>;
    findOwned(userId: string, narrativeId: string): Promise<ZunoFutureSelfNarrative>;
    listForUser(userId: string, filters?: {
        challengeId?: string;
        mode?: FutureSelfMode;
        limit?: number;
    }): Promise<ZunoFutureSelfNarrative[]>;
    markViewed(userId: string, narrativeId: string): Promise<void>;
    private groundingSources;
    private timingContext;
    private safelyGetPlan;
    private safelyGetProgress;
    private findOwnedChallenge;
    private latestContext;
    private closedChallengeIds;
    private recordBlocked;
    private recordBoundaryRefusal;
}
export declare function requestContextForMode(mode: FutureSelfMode): MemoryRequestContext;
export declare const FUTURE_SELF_DEFAULT_MEMORY_TYPES: readonly MemoryType[];
