import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoRealignment } from './zuno-realignment.entity';
import { AssumptionStatus } from '../enums';
export declare class ZunoRealignmentAssumption extends ZunoImmutableEntity {
    realignment_id: string;
    user_id: string;
    assumption_key: string;
    statement: string;
    source: string;
    status: AssumptionStatus;
    invalidated_by_signal_id: string | null;
    affected_components: string[];
    realignment?: ZunoRealignment;
}
