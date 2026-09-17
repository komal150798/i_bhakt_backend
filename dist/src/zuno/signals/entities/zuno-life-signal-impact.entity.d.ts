import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoLifeSignal } from './zuno-life-signal.entity';
import { SignalImpactEntityType, SignalImpactType } from '../enums';
export declare class ZunoLifeSignalImpact extends ZunoImmutableEntity {
    life_signal_id: string;
    user_id: string;
    entity_type: SignalImpactEntityType;
    entity_id: string | null;
    entity_key: string | null;
    impact_type: SignalImpactType;
    impact_score: string | null;
    signal?: ZunoLifeSignal;
}
