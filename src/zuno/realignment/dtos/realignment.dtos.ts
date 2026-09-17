import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ZunoRealignment } from '../entities/zuno-realignment.entity';
import { ZunoRealignmentChange } from '../entities/zuno-realignment-change.entity';
import {
  PlanChangeMode,
  RealignmentChangeType,
  RealignmentLevel,
  RealignmentStatus,
} from '../enums';

/** Step 21 section 45. */
export class EvaluateRealignmentDto {
  @ApiProperty({ description: 'The WhatNow being reassessed.' })
  @IsUUID()
  challengeId: string;

  @ApiPropertyOptional({
    description: 'The confirmed Life Signal that prompted this, if there is one.',
  })
  @IsOptional()
  @IsUUID()
  triggerSignalId?: string;
}

export class ApplyRealignmentDto {
  /**
   * Step 14 section 65: where a change needs the user's agreement, the plan
   * stays untouched until this is true. Sending it when no confirmation is
   * required is harmless.
   */
  @ApiPropertyOptional({ description: 'The user has agreed to this change.' })
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ListRealignmentsQueryDto {
  @ApiProperty()
  @IsUUID()
  challengeId: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** One line of the diff, in the Step 21 section 46 shape. */
export class RealignmentChangeView {
  @ApiProperty({ enum: RealignmentChangeType })
  type: RealignmentChangeType;
  @ApiProperty() reason: string;
  @ApiProperty({ nullable: true }) entityType: string | null;
  @ApiProperty({ nullable: true }) entityId: string | null;

  static from(change: ZunoRealignmentChange): RealignmentChangeView {
    return {
      type: change.change_type,
      reason: change.reason,
      entityType: change.entity_type,
      entityId: change.entity_id,
    };
  }
}

/**
 * Step 21 section 46.
 *
 * `summary` is the whole user-facing story - Step 14 section 60 is explicit
 * that the user gets "this changes our focus", never "context version 4
 * invalidated assumption ASM-003". The internal ids stay in the record.
 */
export class RealignmentView {
  @ApiProperty() realignmentId: string;
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: RealignmentLevel }) level: RealignmentLevel;
  @ApiProperty({ enum: RealignmentStatus }) status: RealignmentStatus;
  @ApiProperty() summary: string;
  @ApiProperty({ type: [RealignmentChangeView] })
  changes: RealignmentChangeView[];
  @ApiProperty({ nullable: true }) newPlanId: string | null;
  @ApiProperty({ enum: PlanChangeMode }) planChangeMode: PlanChangeMode;
  @ApiProperty() scenarioReassessmentRequired: boolean;
  @ApiProperty() mkaRefreshRequired: boolean;
  @ApiProperty() userConfirmationRequired: boolean;
  @ApiProperty({ nullable: true }) triggerSignalId: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty({ nullable: true }) appliedAt: string | null;
  @ApiProperty() version: number;

  static from(
    realignment: ZunoRealignment,
    changes: ZunoRealignmentChange[] = [],
  ): RealignmentView {
    return {
      realignmentId: realignment.id,
      challengeId: realignment.challenge_id,
      level: realignment.level,
      status: realignment.status,
      summary: realignment.reason,
      changes: changes.map(RealignmentChangeView.from),
      newPlanId: (realignment.new_state_ref?.plan_id as string) ?? null,
      planChangeMode: realignment.plan_change_mode,
      scenarioReassessmentRequired: realignment.scenario_reassessment_required,
      mkaRefreshRequired: realignment.mka_refresh_required,
      userConfirmationRequired: realignment.user_confirmation_required,
      triggerSignalId: realignment.trigger_signal_id,
      createdAt: realignment.created_at.toISOString(),
      appliedAt: realignment.applied_at?.toISOString() ?? null,
      version: realignment.version,
    };
  }
}
