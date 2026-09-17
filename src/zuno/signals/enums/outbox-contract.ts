import { ZunoAggregateType, ZunoEventType } from '../../common/enums';

/**
 * The one place where a Phase 9 event name is widened into `ZunoEventType`.
 *
 * `src/zuno/common/enums/event.enum.ts` and the `ZunoAggregateType` beside it
 * are frozen for this change, so the Life Signal and Realignment event names
 * cannot yet be declared where they belong. Rather than sprinkle casts through
 * the services, both funnel through these two helpers: one grep for
 * `asZunoEventType` finds every affected call site on the day the enum is
 * extended, and `OutboxService.enqueue` keeps its typed signature meanwhile.
 *
 * The stored value is a plain string either way - `zuno_event_outbox.event_type`
 * is `varchar(64)` - so nothing about the wire or table format depends on this.
 * WIRING.md lists the exact members to add.
 */
export function asZunoEventType(eventType: string): ZunoEventType {
  return eventType as ZunoEventType;
}

export function asZunoAggregateType(aggregate: string): ZunoAggregateType {
  return aggregate as ZunoAggregateType;
}
