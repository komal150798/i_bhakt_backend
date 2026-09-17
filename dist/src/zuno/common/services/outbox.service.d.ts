import { EntityManager } from 'typeorm';
import { ZunoEventOutbox } from '../entities/zuno-event-outbox.entity';
import { ZunoAggregateType, ZunoEventType } from '../enums';
import { RequestContextService } from './request-context.service';
export interface OutboxEventInput {
    aggregateType: ZunoAggregateType;
    aggregateId: string;
    eventType: ZunoEventType;
    payload: Record<string, unknown>;
    eventVersion?: string;
}
export declare class OutboxService {
    private readonly requestContext;
    private readonly logger;
    constructor(requestContext: RequestContextService);
    enqueue(manager: EntityManager, event: OutboxEventInput): Promise<ZunoEventOutbox>;
    enqueueMany(manager: EntityManager, events: OutboxEventInput[]): Promise<void>;
    private assertNoSensitiveKeys;
}
