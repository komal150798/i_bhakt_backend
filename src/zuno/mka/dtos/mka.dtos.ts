import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { MkaDimension } from '../../common/enums';
import { ZunoMkaItem } from '../entities/zuno-mka-item.entity';
import { ZunoMkaProgram } from '../entities/zuno-mka-program.entity';
import { ZunoMkaCompletion } from '../entities/zuno-mka-completion.entity';
import {
  MkaCompletionStatus,
  MkaFrequency,
  MkaPeriodType,
  MkaPriority,
  MkaProgramStatus,
} from '../enums/mka.enum';

export class GenerateMkaDto {
  @ApiProperty({ description: 'The WhatNow this practice programme is for.' })
  @IsUUID()
  challengeId: string;

  @ApiPropertyOptional({ enum: MkaPeriodType, default: MkaPeriodType.WEEK })
  @IsOptional()
  @IsEnum(MkaPeriodType)
  period?: MkaPeriodType;

  /**
   * Step 15 sections 93-95: re-opening a screen is not a reason to regenerate.
   * A caller must ask for a new version explicitly.
   */
  @ApiPropertyOptional({
    description:
      'Force a new programme version even when an equivalent one is active.',
    default: false,
  })
  @IsOptional()
  regenerate?: boolean;
}

export class CompleteMkaItemDto {
  @ApiPropertyOptional({
    description: 'The date the practice was done (defaults to today, UTC).',
    example: '2026-09-17',
  })
  @IsOptional()
  @IsISO8601()
  date?: string;

  /**
   * Step 15 section 70: self-report is sufficient. ZUNO never asks for photos
   * or proof of prayer, donation or ritual, so a note is the most that is ever
   * collected - and it is optional.
   */
  @ApiPropertyOptional({ description: 'An optional note, in the user\'s words.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;
}

export class SkipMkaItemDto extends CompleteMkaItemDto {}

export class ListMkaQueryDto {
  @ApiPropertyOptional({ description: 'Limit to one WhatNow.' })
  @IsOptional()
  @IsUUID()
  challengeId?: string;
}

/**
 * MKA item view. Step 21 section 48.
 *
 * WHAT IS DELIBERATELY WITHHELD.
 * `source_rule_key`, `source_remedy_key`, `rulebook_version_id` and
 * `source_rule_id` never reach the client. Step 21 section 49 says the internal
 * records retain rulebook version, rule id and safety classification, and that
 * "Flutter normally does not need internal rule identifiers". They stay in the
 * database for audit and explainability; they are not part of the contract.
 *
 * `astrologyInformed` is exposed instead - a single boolean the client can use
 * for progressive disclosure (Step 15 sections 39-41) without ever handling an
 * SME rule id.
 */
export class MkaItemView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: MkaDimension }) dimension: MkaDimension;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty({ nullable: true }) purpose: string | null;
  @ApiProperty({ enum: MkaFrequency }) frequency: MkaFrequency;
  @ApiProperty({ nullable: true }) durationMinutes: number | null;
  @ApiProperty({ enum: MkaPriority }) priority: MkaPriority;
  @ApiProperty() karmaEligible: boolean;
  @ApiProperty() planEligible: boolean;
  @ApiProperty() astrologyInformed: boolean;
  @ApiProperty() status: string;

  static from(item: ZunoMkaItem): MkaItemView {
    return {
      id: item.id,
      dimension: item.dimension,
      title: item.title,
      description: item.description,
      purpose: item.purpose,
      frequency: item.frequency,
      durationMinutes: item.duration_minutes,
      priority: item.priority,
      karmaEligible: item.karma_eligible,
      planEligible: item.plan_eligible,
      astrologyInformed: item.rulebook_version_id !== null,
      status: item.status,
    };
  }
}

/** Step 21 section 48: `{ programId, period, items }`. */
export class MkaProgramView {
  @ApiProperty() programId: string;
  @ApiProperty() challengeId: string;
  @ApiProperty({ enum: MkaProgramStatus }) status: MkaProgramStatus;
  @ApiProperty({ enum: MkaPeriodType }) periodType: MkaPeriodType;
  @ApiProperty() period: { start: string; end: string };
  @ApiProperty({ nullable: true }) reviewAt: string | null;
  /**
   * Step 15 section 51: when astrology contributed nothing, say so plainly
   * rather than leaving the client to infer it from an absent field.
   */
  @ApiProperty() remedyStatus: string;
  @ApiProperty({ type: [MkaItemView] }) items: MkaItemView[];

  static from(program: ZunoMkaProgram, items: ZunoMkaItem[]): MkaProgramView {
    return {
      programId: program.id,
      challengeId: program.challenge_id,
      status: program.status,
      periodType: program.period_type,
      period: { start: program.start_date, end: program.end_date },
      reviewAt: program.review_at,
      remedyStatus: program.remedy_status,
      items: items.map(MkaItemView.from),
    };
  }
}

export class MkaCompletionView {
  @ApiProperty() id: string;
  @ApiProperty() itemId: string;
  @ApiProperty() completionDate: string;
  @ApiProperty({ enum: MkaCompletionStatus }) status: MkaCompletionStatus;
  @ApiProperty() karmaEligible: boolean;

  static from(completion: ZunoMkaCompletion): MkaCompletionView {
    return {
      id: completion.id,
      itemId: completion.mka_item_id,
      completionDate: completion.completion_date,
      status: completion.status,
      karmaEligible: completion.karma_eligible,
    };
  }
}
