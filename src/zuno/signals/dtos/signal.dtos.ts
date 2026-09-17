import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ZunoLifeSignal } from '../entities/zuno-life-signal.entity';
import {
  isConfirmedSignal,
  LifeSignalSource,
  LifeSignalStatus,
  LifeSignalType,
  SignalConfirmationStatus,
} from '../enums';

/**
 * Step 21 section 42. `value.statement` carries the user's own words.
 *
 * `signalType` is optional even though the contract shows it: Step 13 Rule 1
 * and Step 11 Rule 2 both refuse to make the user classify their own life
 * before ZUNO will listen. A client that knows the type (a quick-action button)
 * may send it; free text must always work without it.
 */
export class SignalValueDto {
  @ApiProperty({ description: 'What changed, in the user\'s own words.' })
  @IsString()
  @Length(1, 5000)
  statement: string;
}

export class CreateLifeSignalDto {
  @ApiPropertyOptional({
    description: 'The WhatNow this update belongs to, when it is known.',
  })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ enum: LifeSignalType })
  @IsOptional()
  @IsEnum(LifeSignalType)
  signalType?: LifeSignalType;

  @ApiPropertyOptional({ enum: LifeSignalSource })
  @IsOptional()
  @IsEnum(LifeSignalSource)
  source?: LifeSignalSource;

  @ApiProperty({ type: SignalValueDto })
  @IsObject()
  value: SignalValueDto;

  @ApiPropertyOptional({
    description: 'When it happened, if that differs from now.',
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

export class ConfirmLifeSignalDto {
  @ApiPropertyOptional({ description: 'Anything the user wants to add.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;
}

export class ListLifeSignalsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ enum: LifeSignalStatus })
  @IsOptional()
  @IsEnum(LifeSignalStatus)
  status?: LifeSignalStatus;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TrendsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  challengeId?: string;
}

/**
 * Outward shape of one signal.
 *
 * Note what is missing: `confidence`, `relevance`, `fingerprint`,
 * `detector_version`. Step 13 section 83 says the user-visible feed must not
 * expose technical classification, and section 80 keeps the internal mechanics
 * out of the user's way. What does survive is the honesty flag - `confirmed`
 * and `basis` - because that is the one thing the client must not get wrong.
 */
export class LifeSignalView {
  @ApiProperty() signalId: string;
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty({ enum: LifeSignalType }) signalType: LifeSignalType;
  @ApiProperty({ enum: LifeSignalStatus }) status: LifeSignalStatus;
  @ApiProperty({ enum: SignalConfirmationStatus })
  confirmationStatus: SignalConfirmationStatus;

  /** The single predicate a client should branch on. */
  @ApiProperty() confirmed: boolean;

  /**
   * Step 13 Rule 3, stated on the wire. CONFIRMED means the user or ZUNO's own
   * records vouch for it; INFERRED_UNCONFIRMED means ZUNO worked it out and it
   * must be shown as a question, never as a fact.
   */
  @ApiProperty({ enum: ['CONFIRMED', 'INFERRED_UNCONFIRMED'] })
  basis: 'CONFIRMED' | 'INFERRED_UNCONFIRMED';

  @ApiProperty() clarificationRequired: boolean;
  @ApiProperty() realignmentRecommended: boolean;
  @ApiProperty() materiality: string;
  @ApiProperty({ nullable: true }) domain: string | null;
  @ApiProperty() statement: string;
  @ApiProperty({ nullable: true }) occurredAt: string | null;
  @ApiProperty() detectedAt: string;
  @ApiProperty() version: number;

  static from(signal: ZunoLifeSignal): LifeSignalView {
    const confirmed = isConfirmedSignal(signal.confirmation_status);
    return {
      signalId: signal.id,
      challengeId: signal.challenge_id,
      signalType: signal.signal_type,
      status: signal.status,
      confirmationStatus: signal.confirmation_status,
      confirmed,
      basis: confirmed ? 'CONFIRMED' : 'INFERRED_UNCONFIRMED',
      clarificationRequired: signal.clarification_required,
      realignmentRecommended: signal.realignment_required,
      materiality: signal.materiality,
      domain: signal.domain,
      statement: String(signal.raw_value?.statement ?? ''),
      occurredAt: signal.occurred_at?.toISOString() ?? null,
      detectedAt: signal.detected_at.toISOString(),
      version: signal.version,
    };
  }
}

/** Step 21 section 43. */
export class CreateLifeSignalResponseView {
  @ApiProperty({ nullable: true }) signalId: string | null;
  @ApiProperty({ enum: SignalConfirmationStatus, nullable: true })
  confirmationStatus: SignalConfirmationStatus | null;
  @ApiProperty() realignmentRecommended: boolean;
  @ApiProperty() clarificationRequired: boolean;
  /** True when this was ordinary conversation rather than a change. */
  @ApiProperty() acknowledgedOnly: boolean;
  /** True when it merged into an existing signal (Step 13 section 20). */
  @ApiProperty() duplicateOfExisting: boolean;
  /**
   * True when interpretation needed the SME Rulebook and none is active. The
   * signal is still stored; ZUNO simply says nothing about timing.
   */
  @ApiProperty() interpretationUnavailable: boolean;
  @ApiProperty({ type: LifeSignalView, nullable: true })
  signal: LifeSignalView | null;
}
