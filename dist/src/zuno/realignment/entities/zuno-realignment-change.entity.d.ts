import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { ZunoRealignment } from './zuno-realignment.entity';
import { RealignmentChangeType, RealignmentEntityType } from '../enums';
export declare class ZunoRealignmentChange extends ZunoImmutableEntity {
    realignment_id: string;
    user_id: string;
    entity_type: RealignmentEntityType;
    entity_id: string | null;
    change_type: RealignmentChangeType;
    before_value: Record<string, unknown> | null;
    after_value: Record<string, unknown> | null;
    reason: string;
    realignment?: ZunoRealignment;
}
