import { DataSource, Repository } from 'typeorm';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { SafetyService } from '../../safety/services/safety.service';
import { RulebookRepositoryService } from '../../rulebook/services/rulebook-repository.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { LifeSignalOrigin, LifeSignalSource, LifeSignalStatus, LifeSignalType } from '../enums';
import { SignalClassifierService } from './signal-classifier.service';
export interface RecordSignalParams {
    user: ZunoUser;
    challengeId: string | null;
    signalType?: LifeSignalType;
    source?: LifeSignalSource;
    origin?: LifeSignalOrigin;
    statement: string;
    occurredAt?: Date | null;
    sourceEventId?: string | null;
}
export interface RecordSignalResult {
    signal: ZunoLifeSignal | null;
    ignoredAsNoise: boolean;
    noiseReason: string | null;
    deduplicated: boolean;
    realignmentRecommended: boolean;
    clarificationRequired: boolean;
    interpretationUnavailable: boolean;
}
export interface ListSignalsParams {
    userId: string;
    challengeId?: string | null;
    status?: LifeSignalStatus;
    limit: number;
}
export interface SeparatedSignals {
    confirmed: ZunoLifeSignal[];
    unconfirmed: ZunoLifeSignal[];
}
export declare class LifeSignalService {
    private readonly signals;
    private readonly challenges;
    private readonly classifier;
    private readonly safety;
    private readonly rulebook;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(signals: Repository<ZunoLifeSignal>, challenges: Repository<ZunoChallenge>, classifier: SignalClassifierService, safety: SafetyService, rulebook: RulebookRepositoryService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    record(params: RecordSignalParams): Promise<RecordSignalResult>;
    confirm(user: ZunoUser, signalId: string, note?: string): Promise<ZunoLifeSignal>;
    reject(user: ZunoUser, signalId: string, note?: string): Promise<ZunoLifeSignal>;
    findOwned(userId: string, signalId: string): Promise<ZunoLifeSignal>;
    listSeparated(params: ListSignalsParams): Promise<SeparatedSignals>;
    actionableSignals(userId: string, challengeId: string): Promise<ZunoLifeSignal[]>;
    isStale(signal: ZunoLifeSignal, now: Date): boolean;
    sweepStale(userId: string, challengeId?: string | null): Promise<number>;
    private query;
    private findOwnedChallenge;
    private activate;
    private replaces;
    private requiresRealignment;
    private impactType;
    private initialConfirmationStatus;
    private appendSource;
    private transition;
}
