import { EntityManager } from 'typeorm';

/**
 * DI token for the thing a realignment acts upon.
 *
 * Bound to a no-op by default (see `NoopRealignmentTarget`) so the Realignment
 * Engine runs, and is testable, before the Plan and MKA modules exist. When
 * they land, they bind a real implementation to this token and nothing in this
 * module changes.
 */
export const REALIGNMENT_TARGET = Symbol('REALIGNMENT_TARGET');

/**
 * Everything an implementation is given for one realignment.
 *
 * `manager` is the load-bearing field and the reason this interface exists in
 * this shape. Step 14 section 88 and Roadmap section 63 require a realignment
 * to be all-or-nothing: the plan, the MKA programme and the pending reminders
 * change together or not at all, because a user left with half a realignment
 * has a plan that contradicts itself. That guarantee is only real if every
 * write goes through the *caller's* transaction.
 *
 * So: an implementation MUST perform all of its writes with this EntityManager.
 * It must not use an injected `Repository`, must not call
 * `dataSource.transaction()` itself, and must not open a QueryRunner. Any of
 * those escape the enclosing transaction, and a later failure would roll back
 * the realignment record while leaving the plan already mutated - the exact
 * corruption the requirement exists to prevent.
 */
export interface RealignmentTargetContext {
  /** The enclosing transaction. Every write must use this. */
  manager: EntityManager;
  userId: string;
  challengeId: string;
  realignmentId: string;
  /** The realignment's clock reading, so all rows agree on "now". */
  occurredAt: Date;
}

/** What the user is currently pointed at, before anything changes. */
export interface CurrentDirection {
  planId: string | null;
  planVersion: number | null;
  mkaProgramId: string | null;
  /** Plan items not yet done, which a realignment may retire. */
  pendingItemIds: string[];
  /** Scheduled reminders that would otherwise fire for retired work. */
  pendingReminderIds: string[];
  /**
   * Statements the current direction rests on, e.g. "Current employment
   * continues". Step 14 sections 24-25: a realignment is explainable precisely
   * because it can name the assumption that stopped being true.
   */
  assumptions: { key: string; statement: string }[];
  /** False when no implementation is bound; callers must not fabricate state. */
  available: boolean;
}

export interface CancelPendingItemsInput {
  /** Specific items to retire; omit to retire every pending item. */
  itemIds?: string[];
  /**
   * Machine reason, stored on each item. Step 14 section 74 requires
   * CANCELLED_BY_REALIGNMENT to be distinguishable from MISSED, because the
   * Karma Ledger must never penalise a user for work ZUNO withdrew.
   */
  reasonCode: string;
  reason: string;
}

export interface CancelPendingItemsResult {
  cancelledItemIds: string[];
  applied: boolean;
}

export interface SupersedeProgrammeInput {
  mkaProgramId: string | null;
  reason: string;
  /** False when the existing MKA still fits. Step 14 section 52. */
  refreshRequired: boolean;
}

export interface SupersedeProgrammeResult {
  supersededProgramId: string | null;
  successorProgramId: string | null;
  applied: boolean;
}

export interface SuppressRemindersInput {
  reminderIds?: string[];
  reason: string;
}

export interface SuppressRemindersResult {
  suppressedReminderIds: string[];
  applied: boolean;
}

export interface ActivateSuccessorPlanInput {
  /**
   * PATCH keeps the current plan and adjusts it; REGENERATE creates a new plan
   * version and archives the active one. Step 14 sections 31-34.
   */
  mode: 'PATCH' | 'REGENERATE';
  previousPlanId: string | null;
  reason: string;
  /** Step 14 sections 35-36: these survive regeneration. */
  preserveItemIds: string[];
}

export interface ActivateSuccessorPlanResult {
  planId: string | null;
  planVersion: number | null;
  archivedPlanId: string | null;
  applied: boolean;
}

/**
 * The operations a realignment performs on a plan and its MKA programme.
 *
 * The Realignment Engine decides *what* must change; the owning engine performs
 * it (Step 14 Rule 8). This port is that boundary, expressed so the decision
 * side can be built, shipped and tested without the Plan and MKA modules.
 *
 * CONTRACT FOR IMPLEMENTERS
 *
 * 1. Use `ctx.manager` for every read and write. See RealignmentTargetContext.
 * 2. Be idempotent per `ctx.realignmentId`. Step 14 section 85: the same
 *    trigger must not produce repeated identical realignments, and an apply may
 *    be retried after an infrastructure failure.
 * 3. Never delete history. Step 14 sections 35-36: completed work stays in the
 *    user's journey, the Karma Ledger and analytics. Supersede, do not erase.
 * 4. Cancel with the realignment reason, never as a miss (section 74).
 * 5. Verify ownership of anything you touch against `ctx.userId`. This module
 *    has already checked the challenge, not your rows.
 * 6. Throw on failure. Returning a partial success silently is worse than
 *    failing: the caller rolls the whole transaction back on a throw, which is
 *    the correct outcome (section 87).
 */
export interface RealignmentTarget {
  /** Read the current direction. Must not mutate anything. */
  loadCurrentDirection(ctx: RealignmentTargetContext): Promise<CurrentDirection>;

  cancelPendingItems(
    ctx: RealignmentTargetContext,
    input: CancelPendingItemsInput,
  ): Promise<CancelPendingItemsResult>;

  supersedeProgramme(
    ctx: RealignmentTargetContext,
    input: SupersedeProgrammeInput,
  ): Promise<SupersedeProgrammeResult>;

  suppressPendingReminders(
    ctx: RealignmentTargetContext,
    input: SuppressRemindersInput,
  ): Promise<SuppressRemindersResult>;

  activateSuccessorPlan(
    ctx: RealignmentTargetContext,
    input: ActivateSuccessorPlanInput,
  ): Promise<ActivateSuccessorPlanResult>;
}
