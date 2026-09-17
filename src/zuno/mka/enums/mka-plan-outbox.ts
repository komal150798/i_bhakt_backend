import { EntityManager } from 'typeorm';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAggregateType, ZunoEventType } from '../../common/enums';
import { MkaPlanAggregateType, MkaPlanEventType } from './mka-plan-event.enum';

/**
 * The single place where MKA/Plan event names are widened to the central
 * outbox signature.
 *
 * `OutboxService.enqueue` takes `ZunoEventType` and `ZunoAggregateType`, both
 * declared in `common/enums/event.enum.ts`, which this module must not edit.
 * The values in `MkaPlanEventType` are destined for that enum (see WIRING.md);
 * until they are merged, they need one narrowing conversion.
 *
 * Confining it to this helper means:
 *   - no `as any` is scattered through the services;
 *   - the outbox row still stores the correct wire name, because the columns
 *     are varchar and the enum is a string union at runtime;
 *   - after the merge, this file becomes a plain re-export and the casts are
 *     deleted in one edit rather than twenty.
 *
 * Deliberately NOT done by loosening the OutboxService signature - that would
 * remove the type safety every other ZUNO module currently relies on.
 */
export interface MkaPlanOutboxEvent {
  aggregateType: MkaPlanAggregateType;
  aggregateId: string;
  eventType: MkaPlanEventType;
  payload: Record<string, unknown>;
  eventVersion?: string;
}

export async function enqueueMkaPlanEvent(
  outbox: OutboxService,
  manager: EntityManager,
  event: MkaPlanOutboxEvent,
): Promise<void> {
  await outbox.enqueue(manager, {
    aggregateType: event.aggregateType as unknown as ZunoAggregateType,
    aggregateId: event.aggregateId,
    eventType: event.eventType as unknown as ZunoEventType,
    payload: event.payload,
    eventVersion: event.eventVersion,
  });
}

export async function enqueueMkaPlanEvents(
  outbox: OutboxService,
  manager: EntityManager,
  events: MkaPlanOutboxEvent[],
): Promise<void> {
  for (const event of events) {
    await enqueueMkaPlanEvent(outbox, manager, event);
  }
}
