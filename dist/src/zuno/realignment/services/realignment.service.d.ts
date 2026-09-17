import { DataSource, Repository } from 'typeorm';
import { ZunoRealignment } from '../entities/zuno-realignment.entity';
import { ZunoRealignmentChange } from '../entities/zuno-realignment-change.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoLifeSignal } from '../../signals/entities/zuno-life-signal.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { LifeSignalService } from '../../signals/services/life-signal.service';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { RealignmentTrigger } from '../enums';
import { RealignmentTarget } from '../ports/realignment-target.port';
export declare const REALIGNMENT_ENGINE_VERSION = "realignment-engine@1.0.0";
export interface EvaluateRealignmentParams {
    user: ZunoUser;
    challengeId: string;
    triggerSignalId?: string | null;
    trigger?: RealignmentTrigger;
}
export interface RealignmentDecision {
    realignment: ZunoRealignment;
    changes: ZunoRealignmentChange[];
    idempotentReplay: boolean;
}
export interface ApplyRealignmentParams {
    user: ZunoUser;
    realignmentId: string;
    userConfirmed?: boolean;
    expectedVersion?: number;
}
export interface AppliedRealignment {
    realignment: ZunoRealignment;
    cancelledItemIds: string[];
    suppressedReminderIds: string[];
    supersededProgramId: string | null;
    newPlanId: string | null;
    targetApplied: boolean;
}
export declare class RealignmentService {
    private readonly realignments;
    private readonly challenges;
    private readonly signals;
    private readonly target;
    private readonly lifeSignals;
    private readonly safety;
    private readonly rulebook;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(realignments: Repository<ZunoRealignment>, challenges: Repository<ZunoChallenge>, signals: Repository<ZunoLifeSignal>, target: RealignmentTarget, lifeSignals: LifeSignalService, safety: SafetyService, rulebook: RulebookRepositoryService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    evaluate(params: EvaluateRealignmentParams): Promise<RealignmentDecision>;
    apply(params: ApplyRealignmentParams): Promise<AppliedRealignment>;
    findOwned(userId: string, realignmentId: string): Promise<ZunoRealignment>;
    list(userId: string, challengeId: string, limit?: number): Promise<ZunoRealignment[]>;
    changesFor(realignmentId: string): Promise<ZunoRealignmentChange[]>;
    private findOwnedChallenge;
    private loadTriggerSignal;
    private level;
    private scope;
    private reasonCodes;
    private planChangeMode;
    private mkaRefreshRequired;
    private confirmationRequired;
    private explain;
    private writeDiff;
    private writeAssumptions;
    private assumptionStatement;
    private recordAppliedChanges;
    private settleTriggerSignals;
    private moveChallenge;
    private transition;
    private triggerFingerprint;
}
