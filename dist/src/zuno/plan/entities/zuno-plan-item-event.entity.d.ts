import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { PlanItemEventSource, PlanItemEventType, PlanItemStatus } from '../enums/plan.enum';
export declare class ZunoPlanItemEvent extends ZunoImmutableEntity {
    plan_item_id: string;
    plan_id: string;
    user_id: string;
    event_type: PlanItemEventType;
    old_status: PlanItemStatus | null;
    new_status: PlanItemStatus | null;
    reason: string | null;
    source: PlanItemEventSource;
}
