import { Injectable, Logger } from '@nestjs/common';

/**
 * The Plan + Progress port.
 *
 * WHY THIS EXISTS
 *
 * Roadmap section 70 requires Future Self to generate grounded responses from
 * the current challenge, the current Plan, relevant Memory and progress. This
 * module owns Memory, and reads Challenge directly. It does not own Plan, MKA,
 * Karma Ledger, Life Signals or Realignment, and those modules are being built
 * concurrently by other work - importing them would couple this phase to code
 * that does not exist yet and would break the moment their shape changed.
 *
 * Build Rule 173 covers exactly this situation: isolate the interface, use a
 * controlled default for development, document the blocker, and retain the
 * integration requirement. This file is that isolation.
 *
 * THE CONTRACT, FOR WHOEVER IMPLEMENTS IT
 *
 * An implementation must be:
 *   - ownership-safe. Both methods take a userId and must return nothing that
 *     does not belong to that user. Future Self does not re-check; it trusts
 *     this boundary, so the boundary has to be real.
 *   - non-throwing for the "nothing yet" case. A user with no plan is normal,
 *     not an error. Return null / empty arrays.
 *   - grounded. Every string returned here may end up quoted back to the user
 *     as something they did, so it must describe something that actually
 *     happened and is recorded. Do not return projections, estimates or
 *     encouragement.
 *   - free of raw sensitive detail. Titles are shown; amounts, diagnoses and
 *     third-party names are not needed and should not be sent.
 *
 * Every item carries `sourceEntityType` / `sourceEntityId` because Step 18
 * section 38 requires every narrative statement to be traceable to stored
 * facts, and `future_self_sources` records exactly those pairs.
 */

export interface PlanItemSnapshot {
  id: string;
  title: string;
  /** Free-form in the port so a Plan module can use its own lifecycle. */
  status: string;
  dueAt: Date | null;
}

export interface PlanSnapshot {
  planId: string;
  title: string;
  status: string;
  /** Items still open. Completed work belongs in ProgressSnapshot. */
  activeItems: PlanItemSnapshot[];
}

export interface CompletedAction {
  id: string;
  title: string;
  completedAt: Date;
  /** e.g. 'ZunoPlanItem', 'ZunoKarmaEntry', 'ZunoMkaAction'. */
  sourceEntityType: string;
  sourceEntityId: string;
}

export interface ProgressSnapshot {
  /**
   * What the user actually did, from structured systems. Step 18 section 16:
   * progress comes from the Plan Engine, MKA, Karma Ledger and Life Signals -
   * not from a model's impression of the conversation.
   */
  completedActions: CompletedAction[];
  /** Named commitments still outstanding. Step 18 section 73. */
  openLoops: string[];
  /**
   * Grounded follow-through patterns, e.g. "four difficult career actions
   * completed this month". Step 18 section 42 allows this and forbids
   * converting it into "our cosmic Karma improved".
   */
  observedPatterns: string[];
}

export interface IPlanProgressProvider {
  /** Null when the user has no plan for this challenge. Not an error. */
  getCurrentPlan(
    userId: string,
    challengeId: string | null,
  ): Promise<PlanSnapshot | null>;

  getProgress(
    userId: string,
    challengeId: string | null,
    since: Date,
  ): Promise<ProgressSnapshot>;
}

/** Nest DI token. Consumers inject the interface, never a concrete class. */
export const PLAN_PROGRESS_PROVIDER = Symbol('PLAN_PROGRESS_PROVIDER');

/**
 * The default binding: a provider that honestly reports having nothing.
 *
 * Not a stub that fabricates plausible plan data. Build Rule 129 forbids
 * passing off canned output as personalised, and a Future Self narrative built
 * on invented progress would be precisely the failure roadmap section 71
 * exists to prevent - the boundary validator downstream would have no way to
 * tell invented-by-the-mock from invented-by-the-model.
 *
 * With this bound, Future Self still works: it grounds itself in the challenge
 * and in memory, and simply has less to say about plan progress. That is the
 * correct degradation (Step 21 section 99).
 */
@Injectable()
export class NullPlanProgressProvider implements IPlanProgressProvider {
  private readonly logger = new Logger(NullPlanProgressProvider.name);

  async getCurrentPlan(): Promise<PlanSnapshot | null> {
    this.logger.debug(
      'No Plan module bound to PLAN_PROGRESS_PROVIDER; Future Self will ground itself in challenge and memory only.',
    );
    return null;
  }

  async getProgress(): Promise<ProgressSnapshot> {
    return { completedActions: [], openLoops: [], observedPatterns: [] };
  }
}
