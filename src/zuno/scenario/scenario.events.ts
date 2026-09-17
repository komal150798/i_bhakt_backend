import { ZunoEventType } from '../common/enums';

/**
 * Domain events emitted by the Scenario and What-If engines.
 *
 * WHY THESE ARE DECLARED HERE AND NOT IN `common/enums/event.enum.ts`
 *
 * `ZunoEventType` is the shared canonical event vocabulary (Build Rule 180) and
 * is owned by the common contract package, which this phase does not modify.
 * The four values below are the events Step 12 requires this engine to publish:
 *
 *   section 59  "the Scenario Engine should emit structured change rather than
 *                modify the Plan directly"
 *   section 58  active scenarios define what the Life Signal Engine watches
 *   section 23  a triggered scenario must be handed to the Life Signal /
 *               Realignment flow rather than kept as a hypothetical
 *   section 66  Realignment needs the set diff
 *
 * Dropping the events instead would be worse than declaring them here: the
 * outbox is how Realignment and Life Signal learn that anything happened, and
 * an engine that emits nothing is an engine nothing can react to.
 *
 * WIRING.md lists these as the exact values to add to `ZunoEventType`. Until
 * that promotion happens, `scenarioEvent()` is the single narrow point where
 * the cast occurs, so the debt is one function rather than four call sites.
 *
 * `aggregate_type` needs no such treatment: a scenario set belongs to a
 * challenge, so these are published as CHALLENGE-aggregate events with the
 * scenario set or session id in the payload. No new aggregate type is invented.
 */
export const SCENARIO_EVENT_TYPES = {
  /** A new versioned scenario set was generated. Step 12 sections 65, 83. */
  SCENARIO_SET_GENERATED: 'zuno.scenario.set_generated',
  /** Relevance or impact moved materially. Step 12 sections 59, 66. */
  SCENARIO_CHANGED: 'zuno.scenario.changed',
  /** A scenario became current reality. Step 12 sections 22-23. */
  SCENARIO_TRIGGERED: 'zuno.scenario.triggered',
  /**
   * A hypothetical was explored. Carries `hypothetical: true` and
   * `current_plan_changed: false` so that any consumer which does start
   * listening cannot mistake it for a state change (Step 12 section 39).
   */
  WHAT_IF_EXPLORED: 'zuno.what_if.explored',
} as const;

export type ScenarioEventName =
  (typeof SCENARIO_EVENT_TYPES)[keyof typeof SCENARIO_EVENT_TYPES];

/**
 * The single cast site. Keeping it in one function means the promotion into
 * `ZunoEventType` is a delete-and-reimport, not an audit of the module.
 */
export function scenarioEvent(name: ScenarioEventName): ZunoEventType {
  return name as unknown as ZunoEventType;
}
