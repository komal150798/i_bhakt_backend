import { DataSource, Repository } from 'typeorm';
import { ZunoMkaProgram } from '../entities/zuno-mka-program.entity';
import { ZunoMkaItem } from '../entities/zuno-mka-item.entity';
import { ZunoMkaCompletion } from '../entities/zuno-mka-completion.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../../challenges/entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { MkaItemStatus, MkaPeriodType, MkaProgramStatus } from '../enums/mka.enum';
export interface GenerateMkaParams {
    user: ZunoUser;
    challengeId: string;
    period?: MkaPeriodType;
    regenerate?: boolean;
    reason?: string;
}
export interface MkaProgramWithItems {
    program: ZunoMkaProgram;
    items: ZunoMkaItem[];
}
export declare class MkaService {
    private readonly programs;
    private readonly items;
    private readonly completions;
    private readonly challenges;
    private readonly contexts;
    private readonly responses;
    private readonly rulebook;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(programs: Repository<ZunoMkaProgram>, items: Repository<ZunoMkaItem>, completions: Repository<ZunoMkaCompletion>, challenges: Repository<ZunoChallenge>, contexts: Repository<ZunoChallengeContext>, responses: Repository<ZunoResponse>, rulebook: RulebookRepositoryService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    generate(params: GenerateMkaParams): Promise<MkaProgramWithItems>;
    private selectApprovedRemedies;
    private mapRemedyFrequency;
    private mindCandidate;
    private karmaFallbackCandidates;
    private actionCandidates;
    private prioritiesFromResponse;
    private fromTemplate;
    private deduplicate;
    private applyLoadLimits;
    private ensurePracticalAction;
    private postCheckCandidates;
    findOwnedChallenge(userId: string, challengeId: string): Promise<ZunoChallenge>;
    findOwnedProgram(userId: string, programId: string): Promise<ZunoMkaProgram>;
    findOwnedItem(userId: string, itemId: string): Promise<ZunoMkaItem>;
    findActiveProgram(userId: string, challengeId: string): Promise<ZunoMkaProgram | null>;
    itemsFor(programId: string): Promise<ZunoMkaItem[]>;
    planEligibleItems(programId: string): Promise<ZunoMkaItem[]>;
    currentForChallenge(user: ZunoUser, challengeId: string): Promise<MkaProgramWithItems>;
    listPrograms(userId: string, challengeId?: string): Promise<ZunoMkaProgram[]>;
    completeItem(user: ZunoUser, itemId: string, options?: {
        date?: string;
        note?: string;
    }): Promise<ZunoMkaCompletion>;
    skipItem(user: ZunoUser, itemId: string, options?: {
        date?: string;
        note?: string;
    }): Promise<ZunoMkaCompletion>;
    private recordCompletion;
    completionsFor(userId: string, programId: string): Promise<ZunoMkaCompletion[]>;
    completeProgram(user: ZunoUser, programId: string, expectedVersion?: number): Promise<ZunoMkaProgram>;
    private supersede;
    transitionProgram(from: MkaProgramStatus, to: MkaProgramStatus): MkaProgramStatus;
    transitionItem(from: MkaItemStatus, to: MkaItemStatus): MkaItemStatus;
    private domainsFor;
    private periodWindow;
    private recordBlocked;
    private trim;
}
