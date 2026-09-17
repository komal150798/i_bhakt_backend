import { EntityManager } from 'typeorm';
import { OutboxService } from '../../common/services/outbox.service';
import { MkaPlanAggregateType, MkaPlanEventType } from './mka-plan-event.enum';
export interface MkaPlanOutboxEvent {
    aggregateType: MkaPlanAggregateType;
    aggregateId: string;
    eventType: MkaPlanEventType;
    payload: Record<string, unknown>;
    eventVersion?: string;
}
export declare function enqueueMkaPlanEvent(outbox: OutboxService, manager: EntityManager, event: MkaPlanOutboxEvent): Promise<void>;
export declare function enqueueMkaPlanEvents(outbox: OutboxService, manager: EntityManager, events: MkaPlanOutboxEvent[]): Promise<void>;
