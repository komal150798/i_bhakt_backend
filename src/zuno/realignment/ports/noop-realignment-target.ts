import { Injectable, Logger } from '@nestjs/common';
import {
  ActivateSuccessorPlanResult,
  CancelPendingItemsResult,
  CurrentDirection,
  RealignmentTarget,
  RealignmentTargetContext,
  SupersedeProgrammeResult,
  SuppressRemindersResult,
} from './realignment-target.port';

/**
 * Default `REALIGNMENT_TARGET` binding: does nothing, and says so.
 *
 * The same reasoning as `GeocoderProvider`'s null implementation - the fail-safe
 * behaviour is the default, and a missing dependency produces an honest empty
 * answer rather than a fabricated one. Every result carries `applied: false`
 * and `loadCurrentDirection` returns `available: false`, so the Realignment
 * Engine records truthfully that no plan was touched instead of claiming a
 * plan change that never happened (Build Rule 128: never return a fabricated
 * success).
 *
 * It is deliberately not a silent success. A realignment applied against this
 * target is a real, recorded realignment decision with no plan effect - which
 * is exactly the state of the system until the Plan and MKA modules bind here.
 */
@Injectable()
export class NoopRealignmentTarget implements RealignmentTarget {
  private readonly logger = new Logger(NoopRealignmentTarget.name);

  async loadCurrentDirection(
    ctx: RealignmentTargetContext,
  ): Promise<CurrentDirection> {
    this.logger.debug(
      `No realignment target bound; realignment ${ctx.realignmentId} will record a decision only.`,
    );
    return {
      planId: null,
      planVersion: null,
      mkaProgramId: null,
      pendingItemIds: [],
      pendingReminderIds: [],
      assumptions: [],
      available: false,
    };
  }

  async cancelPendingItems(): Promise<CancelPendingItemsResult> {
    return { cancelledItemIds: [], applied: false };
  }

  async supersedeProgramme(): Promise<SupersedeProgrammeResult> {
    return {
      supersededProgramId: null,
      successorProgramId: null,
      applied: false,
    };
  }

  async suppressPendingReminders(): Promise<SuppressRemindersResult> {
    return { suppressedReminderIds: [], applied: false };
  }

  async activateSuccessorPlan(): Promise<ActivateSuccessorPlanResult> {
    return {
      planId: null,
      planVersion: null,
      archivedPlanId: null,
      applied: false,
    };
  }
}
