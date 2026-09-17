import { ZunoAggregateType, ZunoEventType } from '../../common/enums';

/**
 * Memory and Future Self domain events. Step 18 section 93.
 *
 * WHY THESE ARE NOT IN `common/enums/event.enum.ts`
 *
 * They belong there - that file is the canonical event vocabulary, and a future
 * change should move them. It is off-limits to this change (it is the shared
 * contract surface and other phases are editing it concurrently), so the values
 * live here and are widened at the single call site that enqueues them.
 *
 * The widening is a deliberate, localised cast rather than a type hole:
 * `OutboxService.enqueue` takes `ZunoEventType`, and the alternative -
 * inventing a parallel outbox - would be far worse. The string values below are
 * exactly the ones Step 18 section 93 names, so the move is a rename of the
 * declaration site and nothing else.
 *
 * Tracked in WIRING.md under "Outbox events".
 */
export const MemoryEventType = {
  CANDIDATE_CREATED: 'zuno.memory.candidate_created',
  CREATED: 'zuno.memory.created',
  UPDATED: 'zuno.memory.updated',
  SUPERSEDED: 'zuno.memory.superseded',
  EXPIRED: 'zuno.memory.expired',
  DELETED: 'zuno.memory.deleted',
  CONFLICT_DETECTED: 'zuno.memory.conflict_detected',
  CORRECTED: 'zuno.memory.corrected',
  PATTERN_CANDIDATE_CREATED: 'zuno.pattern.candidate_created',
  PATTERN_CONFIRMED: 'zuno.pattern.confirmed',
  FUTURE_SELF_GENERATED: 'zuno.future_self.generated',
  FUTURE_SELF_VIEWED: 'zuno.future_self.viewed',
  FUTURE_SELF_FEEDBACK_RECEIVED: 'zuno.future_self.feedback_received',
} as const;

export type MemoryEventTypeValue =
  (typeof MemoryEventType)[keyof typeof MemoryEventType];

export const MemoryAggregateType = {
  MEMORY: 'MEMORY',
  MEMORY_CANDIDATE: 'MEMORY_CANDIDATE',
  FUTURE_SELF: 'FUTURE_SELF',
} as const;

export type MemoryAggregateTypeValue =
  (typeof MemoryAggregateType)[keyof typeof MemoryAggregateType];

/**
 * The two widening helpers. Isolated here so there is exactly one place to
 * delete when the values move into the shared enums.
 */
export function asEventType(value: MemoryEventTypeValue): ZunoEventType {
  return value as unknown as ZunoEventType;
}

export function asAggregateType(
  value: MemoryAggregateTypeValue,
): ZunoAggregateType {
  return value as unknown as ZunoAggregateType;
}
