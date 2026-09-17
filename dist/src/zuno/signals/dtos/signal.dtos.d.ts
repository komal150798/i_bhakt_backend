import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import { LifeSignalSource, LifeSignalStatus, LifeSignalType, SignalConfirmationStatus } from '../enums';
export declare class SignalValueDto {
    statement: string;
}
export declare class CreateLifeSignalDto {
    challengeId?: string;
    signalType?: LifeSignalType;
    source?: LifeSignalSource;
    value: SignalValueDto;
    occurredAt?: string;
}
export declare class ConfirmLifeSignalDto {
    note?: string;
}
export declare class ListLifeSignalsQueryDto {
    challengeId?: string;
    status?: LifeSignalStatus;
    limit?: number;
}
export declare class TrendsQueryDto {
    challengeId?: string;
}
export declare class LifeSignalView {
    signalId: string;
    challengeId: string | null;
    signalType: LifeSignalType;
    status: LifeSignalStatus;
    confirmationStatus: SignalConfirmationStatus;
    confirmed: boolean;
    basis: 'CONFIRMED' | 'INFERRED_UNCONFIRMED';
    clarificationRequired: boolean;
    realignmentRecommended: boolean;
    materiality: string;
    domain: string | null;
    statement: string;
    occurredAt: string | null;
    detectedAt: string;
    version: number;
    static from(signal: ZunoLifeSignal): LifeSignalView;
}
export declare class CreateLifeSignalResponseView {
    signalId: string | null;
    confirmationStatus: SignalConfirmationStatus | null;
    realignmentRecommended: boolean;
    clarificationRequired: boolean;
    acknowledgedOnly: boolean;
    duplicateOfExisting: boolean;
    interpretationUnavailable: boolean;
    signal: LifeSignalView | null;
}
