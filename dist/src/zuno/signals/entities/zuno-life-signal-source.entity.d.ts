import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import { LifeSignalOrigin, LifeSignalReliability, LifeSignalSource } from '../enums';
export declare class ZunoLifeSignalSource extends ZunoImmutableEntity {
    life_signal_id: string;
    user_id: string;
    source: LifeSignalSource;
    origin: LifeSignalOrigin;
    reliability: LifeSignalReliability;
    source_event_id: string | null;
    source_ref: string | null;
    fingerprint: string;
    payload: Record<string, unknown>;
    observed_at: Date;
    signal?: ZunoLifeSignal;
}
