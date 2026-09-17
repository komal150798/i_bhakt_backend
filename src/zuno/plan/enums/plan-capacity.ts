import { Logger } from '@nestjs/common';
import { PlanItemPriority, PlanType } from './plan.enum';

/**
 * PLAN CAPACITY POLICY.
 *
 * Step 16 section 27 is the source:
 *
 *     TODAY:  1-3 meaningful actions
 *     WEEK:   3-7 meaningful actions
 *     "MKA micro-practices may sit alongside these."
 *     "Exact limits should be configurable."
 *
 * plus Step 16 section 4 ("1 Essential Action + 0-2 Supporting Actions +
 * relevant MKA practice") and section 14 ("only a small number of items should
 * be marked ESSENTIAL").
 *
 * Three consequences are encoded here rather than left to prose:
 *
 * 1. MIND and KARMA practices do NOT count against the action cap.
 *    Section 27 says they sit alongside. Section 41 adds that a 5-minute
 *    grounding practice "should not compete visually with a critical loan
 *    deadline" - if a practice consumed one of three action slots it would be
 *    doing exactly that. They have their own, separate ceiling.
 *
 * 2. ESSENTIAL has its own cap.
 *    Section 15: essential means delay materially affects safety, a deadline,
 *    financial exposure, a critical opportunity, a dependency or the primary
 *    goal. A plan where everything is essential communicates nothing, so
 *    surplus essentials are DEMOTED to IMPORTANT rather than dropped - losing
 *    the action entirely would be worse than losing its emphasis.
 *
 * 3. Excess actions are deferred, not deleted.
 *    Section 54-55: unfinished work is reassessed, not discarded. Overflow
 *    items are still created, as OPTIONAL items outside the active horizon,
 *    and an event records that capacity caused it.
 *
 * `minActions` is advisory only. Step 16 section 19 plans from outcomes, and
 * padding a plan to reach a floor would be exactly the "generate tasks"
 * behaviour section 19 warns against - so falling short is logged, never
 * corrected by invention.
 */
export interface PlanCapacityLimits {
  /** Hard ceiling on meaningful actions in the active horizon. */
  maxActions: number;
  /** Advisory floor. Never satisfied by inventing work. */
  minActions: number;
  /** Ceiling on ESSENTIAL items; surplus is demoted to IMPORTANT. */
  maxEssential: number;
  /** Separate ceiling for MIND/KARMA micro-practices. */
  maxPractices: number;
  /**
   * Advisory ceiling on total estimated effort in the horizon. Step 16
   * section 28 lists "excess estimated time" as an overload signal.
   */
  maxEstimatedMinutes: number;
}

const DEFAULT_PLAN_CAPACITY: Readonly<Record<PlanType, PlanCapacityLimits>> = {
  // Step 16 section 4 / section 36: the user must understand the day in seconds.
  [PlanType.TODAY]: {
    maxActions: 3,
    minActions: 1,
    maxEssential: 1,
    maxPractices: 2,
    maxEstimatedMinutes: 180,
  },
  // Step 16 section 27: 3-7 meaningful actions.
  [PlanType.WEEKLY]: {
    maxActions: 7,
    minActions: 3,
    maxEssential: 2,
    maxPractices: 3,
    maxEstimatedMinutes: 900,
  },
  /**
   * Four weeks at the weekly ceiling. Step 16 section 6 organises a 30-day plan
   * into four weeks or phases, and section 102 calls 25 actions in a single
   * WEEK an anti-pattern - spread across a month it is the intended shape.
   */
  [PlanType.THIRTY_DAY]: {
    maxActions: 28,
    minActions: 4,
    maxEssential: 4,
    maxPractices: 4,
    maxEstimatedMinutes: 3600,
  },
  /**
   * Step 16 section 7: longer plans are directional rather than falsely
   * precise, so the ceiling is low on purpose - a 90-day plan with 60 tasks is
   * a fiction.
   */
  [PlanType.LONG_TERM]: {
    maxActions: 12,
    minActions: 2,
    maxEssential: 2,
    maxPractices: 2,
    maxEstimatedMinutes: 2400,
  },
  [PlanType.CUSTOM]: {
    maxActions: 7,
    minActions: 1,
    maxEssential: 2,
    maxPractices: 3,
    maxEstimatedMinutes: 900,
  },
};

const logger = new Logger('PlanCapacity');

/**
 * Resolves the limits for a plan type, honouring the configurable override
 * Step 16 section 27 requires.
 *
 * `ZUNO_PLAN_CAPACITY_JSON` is a partial map, e.g.
 *   {"TODAY":{"maxActions":2}}
 * Unknown keys and non-positive values are ignored rather than trusted: a typo
 * in an environment variable must not be able to hand a user a 400-item plan,
 * and must not be able to produce a plan with zero actions either.
 */
export function planCapacityFor(planType: PlanType): PlanCapacityLimits {
  const base = DEFAULT_PLAN_CAPACITY[planType] ?? DEFAULT_PLAN_CAPACITY[PlanType.CUSTOM];
  const raw = process.env.ZUNO_PLAN_CAPACITY_JSON;
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<PlanCapacityLimits>>;
    const override = parsed[planType];
    if (!override || typeof override !== 'object') return base;

    const merged: PlanCapacityLimits = { ...base };
    for (const key of Object.keys(merged) as (keyof PlanCapacityLimits)[]) {
      const value = override[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        merged[key] = Math.floor(value);
      }
    }
    // A ceiling of zero actions is never a legitimate configuration; it would
    // silently produce empty plans that look like an engine failure.
    if (merged.maxActions < 1) merged.maxActions = base.maxActions;
    return merged;
  } catch {
    logger.warn(
      'ZUNO_PLAN_CAPACITY_JSON is not valid JSON; falling back to the specification defaults.',
    );
    return base;
  }
}

/** Anything not MIND or KARMA counts as a meaningful action. */
export interface CapacityCountable {
  priority: PlanItemPriority;
  isPractice: boolean;
  estimatedMinutes: number | null;
}

export interface CapacityUsage {
  actions: number;
  essentials: number;
  practices: number;
  estimatedMinutes: number;
}

export function measureCapacity(items: CapacityCountable[]): CapacityUsage {
  return items.reduce<CapacityUsage>(
    (usage, item) => ({
      actions: usage.actions + (item.isPractice ? 0 : 1),
      essentials:
        usage.essentials +
        (!item.isPractice && item.priority === PlanItemPriority.ESSENTIAL ? 1 : 0),
      practices: usage.practices + (item.isPractice ? 1 : 0),
      estimatedMinutes: usage.estimatedMinutes + (item.estimatedMinutes ?? 0),
    }),
    { actions: 0, essentials: 0, practices: 0, estimatedMinutes: 0 },
  );
}

/** True when adding one more of this kind would breach the ceiling. */
export function wouldExceedCapacity(
  usage: CapacityUsage,
  limits: PlanCapacityLimits,
  candidate: CapacityCountable,
): boolean {
  if (candidate.isPractice) return usage.practices >= limits.maxPractices;
  return usage.actions >= limits.maxActions;
}
