import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ZunoKarmaEntry } from '../entities/zuno-karma-entry.entity';
import {
  KarmaCategory,
  KarmaClassification,
  KarmaEntrySource,
  KarmaEntryStatus,
  KarmaIntent,
} from '../enums/karma.enum';
import { KarmaSummary } from '../services/karma.service';

/**
 * Step 21 section 55: a user-created entry is the user's own words plus, at
 * most, when it happened and which WhatNow it belongs to.
 *
 * Notably absent: `points`, `classification` and `category`. Step 17 Rule 3
 * and section 52 put all three under backend control - a client that could
 * post its own points would be the pay-to-score and gaming problem of
 * sections 63 and 67 arriving through the front door.
 */
export class CreateKarmaEntryDto {
  @ApiProperty({
    description: 'What the person did, in their own words.',
    example: 'I helped a colleague prepare for an interview.',
  })
  @IsString()
  @Length(1, 5000)
  text: string;

  @ApiPropertyOptional({
    description:
      'When it actually happened, if not now. ISO-8601. Step 21 section 55.',
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({
    description:
      'The WhatNow this relates to. Optional - Step 17 section 29 allows entries unrelated to any challenge.',
  })
  @IsOptional()
  @IsUUID()
  challengeId?: string;
}

/** Step 21 section 57 / Step 17 section 55: the user disagreeing, in full. */
export class KarmaClassificationFeedbackDto {
  @ApiProperty({
    description: 'Whether the user accepts ZUNO\'s reading of the action.',
  })
  @IsBoolean()
  accepted: boolean;

  @ApiPropertyOptional({
    description: 'The user\'s own explanation. Preserved in revision history.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comment?: string;
}

/**
 * Step 17 section 14: the user may correct the category, the context and the
 * classification, or remove the entry entirely.
 *
 * `points` is again absent, and deliberately so. A correction updates what the
 * entry *says*; the arithmetic stays with the scoring version the entry was
 * recorded under (Step 17 sections 22-23).
 */
export class CorrectKarmaEntryDto {
  @ApiPropertyOptional({ enum: KarmaClassification })
  @IsOptional()
  @IsEnum(KarmaClassification)
  classification?: KarmaClassification;

  @ApiPropertyOptional({ enum: KarmaCategory })
  @IsOptional()
  @IsEnum(KarmaCategory)
  category?: KarmaCategory;

  @ApiPropertyOptional({ enum: KarmaIntent })
  @IsOptional()
  @IsEnum(KarmaIntent)
  intent?: KarmaIntent;

  @ApiPropertyOptional({ description: 'Corrected or expanded wording.' })
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  text?: string;

  @ApiPropertyOptional({ type: KarmaClassificationFeedbackDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => KarmaClassificationFeedbackDto)
  classificationFeedback?: KarmaClassificationFeedbackDto;

  /** Step 21 section 108: optimistic lock. */
  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version?: number;
}

/** Step 17 section 72 / Step 21 section 54: date, category, challenge, source. */
export class ListKarmaQueryDto {
  @ApiPropertyOptional({ enum: KarmaCategory })
  @IsOptional()
  @IsEnum(KarmaCategory)
  category?: KarmaCategory;

  @ApiPropertyOptional({ enum: KarmaClassification })
  @IsOptional()
  @IsEnum(KarmaClassification)
  classification?: KarmaClassification;

  @ApiPropertyOptional({ enum: KarmaEntrySource })
  @IsOptional()
  @IsEnum(KarmaEntrySource)
  source?: KarmaEntrySource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ description: 'Inclusive lower bound, ISO-8601.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Exclusive upper bound, ISO-8601.' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor from a previous page.' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * List projection.
 *
 * `rawText` is absent on purpose. Step 17 sections 3 and 70 and Roadmap
 * section 56 make the ledger the most sensitive collection ZUNO holds, and a
 * list response is the easiest place for it to end up somewhere it should not
 * be - a log, a crash report, an analytics payload built from a screen model.
 * The detail endpoint returns it for the one entry the user asked to read.
 *
 * `visibility` is returned so a client can never assume sharing exists: it is
 * always PRIVATE.
 */
export class KarmaEntryView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: KarmaClassification }) classification: KarmaClassification;
  @ApiProperty({ enum: KarmaCategory }) category: KarmaCategory;
  @ApiProperty({ enum: KarmaIntent, nullable: true }) intent: KarmaIntent | null;
  @ApiProperty() points: number;
  @ApiProperty({ nullable: true }) confidence: number | null;
  @ApiProperty() userConfirmed: boolean;
  @ApiProperty({ enum: KarmaEntryStatus }) status: KarmaEntryStatus;
  @ApiProperty({ enum: KarmaEntrySource }) source: KarmaEntrySource;
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty() visibility: string;
  @ApiProperty() occurredAt: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() version: number;
  @ApiProperty({ description: 'Scoring model this entry was scored under.' })
  scoringModelVersion: string;

  static from(entry: ZunoKarmaEntry): KarmaEntryView {
    return {
      id: entry.id,
      classification: entry.classification,
      category: entry.category,
      intent: entry.intent,
      points: entry.points,
      confidence: entry.confidence === null ? null : Number(entry.confidence),
      userConfirmed: entry.user_confirmed,
      status: entry.status,
      source: entry.source,
      challengeId: entry.challenge_id,
      visibility: entry.visibility,
      occurredAt: entry.occurred_at.toISOString(),
      createdAt: entry.created_at.toISOString(),
      version: entry.version,
      scoringModelVersion: entry.scoring_model_version,
    };
  }
}

/**
 * Single-entry view. Adds the user's own words and the score factors, which
 * Step 17 sections 59-60 require to be explainable - and section 73 asks to be
 * expandable rather than dominant, hence a separate endpoint.
 */
export class KarmaEntryDetailView extends KarmaEntryView {
  @ApiProperty({ nullable: true, description: 'The user\'s own words.' })
  rawText: string | null;

  @ApiProperty({ description: 'Stable evidence labels, never model reasoning.' })
  evidence: string[];

  @ApiProperty({ description: 'What affected the points.' })
  scoreFactors: { factor: string; value: number }[];

  @ApiProperty({ nullable: true }) planItemId: string | null;
  @ApiProperty({ nullable: true }) mkaItemId: string | null;
  @ApiProperty({ nullable: true }) redactedAt: string | null;

  static fromDetail(entry: ZunoKarmaEntry): KarmaEntryDetailView {
    return {
      ...KarmaEntryView.from(entry),
      rawText: entry.raw_text,
      evidence: entry.evidence ?? [],
      scoreFactors: entry.score_factors ?? [],
      planItemId: entry.plan_item_id,
      mkaItemId: entry.mka_item_id,
      redactedAt: entry.redacted_at ? entry.redacted_at.toISOString() : null,
    };
  }
}

/** Step 21 section 55's creation response, plus the explanation of the score. */
export class KarmaEntryCreatedView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: KarmaClassification }) classification: KarmaClassification;
  @ApiProperty({ enum: KarmaCategory }) category: KarmaCategory;
  @ApiProperty() points: number;
  @ApiProperty({ nullable: true }) confidence: number | null;
  @ApiProperty() userConfirmed: boolean;
  /** Step 17 section 54: whether we should ask before this label settles. */
  @ApiProperty() confirmationRequired: boolean;
  /** Step 17 section 60: plain, non-spiritual explanation of the figure. */
  @ApiProperty() explanation: string;

  static from(
    entry: ZunoKarmaEntry,
    confirmationRequired: boolean,
    explanation: string,
  ): KarmaEntryCreatedView {
    return {
      id: entry.id,
      classification: entry.classification,
      category: entry.category,
      points: entry.points,
      confidence: entry.confidence === null ? null : Number(entry.confidence),
      userConfirmed: entry.user_confirmed,
      confirmationRequired,
      explanation,
    };
  }
}

/**
 * Step 17 sections 35-37: today, this week, and the patterns behind them.
 *
 * There is no `rank`, no `percentile` and no comparison to anybody else.
 * Step 17 sections 68 and 106 and Rule 10 rule those out of the core product,
 * and leaving the field out of the contract is what stops a client inventing
 * one.
 */
export class KarmaSummaryView {
  @ApiProperty({ description: 'Approved label for the figure. Step 17 section 39.' })
  pointsLabel: string;

  @ApiProperty({ description: 'How the figure should be described to the user.' })
  framing: string;

  @ApiProperty() today: { entriesRecorded: number; points: number };

  @ApiProperty()
  thisWeek: {
    entriesRecorded: number;
    points: number;
    daysActive: number;
    topCategory: string | null;
    repairActions: number;
  };

  @ApiProperty({ description: 'Observed behavioural patterns, with evidence.' })
  patterns: {
    patternType: string;
    evidenceCount: number;
    lastObservedAt: string;
  }[];

  static from(summary: KarmaSummary): KarmaSummaryView {
    return {
      pointsLabel: summary.pointsLabel,
      framing: summary.framing,
      today: summary.today,
      thisWeek: summary.thisWeek,
      patterns: summary.patterns,
    };
  }
}
