import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ZunoPlan } from '../entities/zuno-plan.entity';
import { ZunoPlanItem } from '../entities/zuno-plan-item.entity';
import {
  PlanItemCategory,
  PlanItemPriority,
  PlanItemStatus,
  PlanStatus,
  PlanType,
} from '../enums/plan.enum';

export class GeneratePlanDto {
  @ApiProperty({ description: 'The WhatNow this plan is for.' })
  @IsUUID()
  challengeId: string;

  @ApiPropertyOptional({ enum: PlanType, default: PlanType.TODAY })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiPropertyOptional({
    description: 'Force a new plan version even when an equivalent one is active.',
    default: false,
  })
  @IsOptional()
  regenerate?: boolean;
}

export class PatchPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  primaryGoal?: string;

  /**
   * Only the statuses a user can legitimately drive. A move to SUPERSEDED is
   * the Plan Engine's to make during regeneration (Step 16 section 90), not
   * something a client may assert.
   */
  @ApiPropertyOptional({
    enum: [PlanStatus.ACTIVE, PlanStatus.PAUSED, PlanStatus.COMPLETED, PlanStatus.CANCELLED],
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  /** Step 21 section 108: optimistic lock. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ActivatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ListPlansQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  challengeId?: string;
}

/** Step 21 section 52. */
export class CompletePlanItemDto {
  @ApiPropertyOptional({ example: '2026-09-17T10:00:00Z' })
  @IsOptional()
  @IsISO8601()
  completedAt?: string;

  @ApiPropertyOptional({ example: 'Spoke to the bank relationship manager.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;
}

export class DeferPlanItemDto {
  @ApiPropertyOptional({
    description: 'The date to move it to.',
    example: '2026-09-19',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class SkipPlanItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class BlockPlanItemDto {
  /**
   * Step 16 section 79: "What's blocking this?" A material blocker can become
   * a Life Signal, which is only possible if we capture it.
   */
  @ApiProperty({ description: "What is blocking this, in the user's words." })
  @IsString()
  @Length(1, 500)
  reason: string;
}

export class AddPlanItemDto {
  @ApiProperty()
  @IsString()
  @Length(1, 300)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiPropertyOptional({ enum: PlanItemCategory })
  @IsOptional()
  @IsEnum(PlanItemCategory)
  category?: PlanItemCategory;

  @ApiPropertyOptional({ enum: PlanItemPriority })
  @IsOptional()
  @IsEnum(PlanItemPriority)
  priority?: PlanItemPriority;

  @ApiPropertyOptional({ maximum: 1440 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  scheduledDate?: string;

  /** Step 16 section 57: "I will call the bank tomorrow" becomes a commitment. */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isCommitment?: boolean;
}

/**
 * Plan item view. Step 21 section 51.
 *
 * `priority` is sent as the numeric rank the published contract shows, and
 * `priorityLabel` alongside it so a client can render "Essential" without
 * hard-coding that 1 means essential. See the SPEC_CONFLICT note on
 * `PLAN_ITEM_PRIORITY_RANK`.
 */
export class PlanItemView {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ nullable: true }) whyThisMatters: string | null;
  @ApiProperty({ enum: PlanItemCategory }) category: PlanItemCategory;
  @ApiProperty({ description: '1 = essential, 2 = important, 3 = optional.' })
  priority: number;
  @ApiProperty({ enum: PlanItemPriority }) priorityLabel: PlanItemPriority;
  @ApiProperty({ enum: PlanItemStatus }) status: PlanItemStatus;
  @ApiProperty() isPractice: boolean;
  @ApiProperty() karmaEligible: boolean;
  @ApiProperty({ nullable: true }) scheduledDate: string | null;
  @ApiProperty({ nullable: true }) dueAt: string | null;
  @ApiProperty({ nullable: true }) estimatedMinutes: number | null;
  @ApiProperty({ nullable: true }) deferredTo: string | null;

  static from(item: ZunoPlanItem): PlanItemView {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      whyThisMatters: item.why_this_matters,
      category: item.category,
      priority: item.priority_rank,
      priorityLabel: item.priority,
      status: item.status,
      isPractice: item.is_practice,
      karmaEligible: item.karma_eligible,
      scheduledDate: item.scheduled_date,
      dueAt: item.due_at ? new Date(item.due_at).toISOString() : null,
      estimatedMinutes: item.estimated_minutes,
      deferredTo: item.deferred_to,
    };
  }
}

/** Step 21 section 51: `{ id, type, title, status, items }`. */
export class PlanView {
  @ApiProperty() id: string;
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: PlanType }) type: PlanType;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) primaryGoal: string | null;
  @ApiProperty({ enum: PlanStatus }) status: PlanStatus;
  @ApiProperty() startDate: string;
  @ApiProperty({ nullable: true }) endDate: string | null;
  @ApiProperty({ nullable: true }) reviewAt: string | null;
  @ApiProperty() version: number;
  @ApiProperty({ type: [PlanItemView] }) items: PlanItemView[];

  static from(plan: ZunoPlan, items: ZunoPlanItem[]): PlanView {
    return {
      id: plan.id,
      challengeId: plan.challenge_id,
      type: plan.plan_type,
      title: plan.title,
      primaryGoal: plan.primary_goal,
      status: plan.status,
      startDate: plan.start_date,
      endDate: plan.end_date,
      reviewAt: plan.review_at,
      version: plan.version,
      items: items.map(PlanItemView.from),
    };
  }

  /** Summary form for list endpoints - no item array. */
  static summary(plan: ZunoPlan): PlanView {
    return PlanView.from(plan, []);
  }
}
