import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoFutureSelfNarrative } from './zuno-future-self-narrative.entity';
export declare class ZunoFutureSelfSource extends ZunoImmutableEntity {
    future_self_narrative_id: string;
    source_entity_type: string;
    source_entity_id: string;
    narrative?: ZunoFutureSelfNarrative;
}
