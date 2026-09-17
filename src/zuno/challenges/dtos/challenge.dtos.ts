import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ChallengeStatus } from '../../common/enums';
import { ZunoChallenge } from '../entities/zuno-challenge.entity';
import { ZunoChallengeContext } from '../entities/zuno-challenge-context.entity';
import { ZunoResponse } from '../../responses/entities/zuno-response.entity';

/**
 * Step 21 section 25: creation takes the user's own words and nothing else.
 *
 * Notably absent: any domain, category or urgency field. Step 11 Rule 2 is
 * explicit - "never require the user to select a life category before they can
 * explain their problem". Offering the field at all would invite a client to
 * build that picker.
 */
export class CreateChallengeDto {
  @ApiProperty({
    description: 'What the person wants to talk through, in their own words.',
    example:
      'Many people have been laid off in my company in Dubai. I have a home loan and I am worried about what happens if I lose my job.',
  })
  @IsString()
  @Length(1, 5000)
  statement: string;
}

export class ResolveChallengeDto {
  @ApiPropertyOptional({ description: 'How it worked out, in the user\'s words.' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;

  /**
   * Step 21 section 108: optimistic lock. A stale version yields 409 rather
   * than overwriting newer state written by a Realignment.
   */
  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ReopenChallengeDto {
  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class ListChallengesQueryDto {
  @ApiPropertyOptional({ enum: ChallengeStatus })
  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /** Cursor pagination per Step 21 section 17. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Challenge view model.
 *
 * Step 21 Anti-Pattern 137 forbids returning database rows as API contracts,
 * so this is an explicit projection. Three things are deliberately withheld:
 *
 *   raw_user_statement - echoing the user's private text back on every list
 *     response is unnecessary data exposure (Step 21 section 112).
 *   priority - Step 11 section 36 warns against showing a robotic internal
 *     score without a clear UX reason.
 *   primary_domain/theme are included because the client needs *some* grouping
 *     signal, but Step 11 Rule 5 means the client must render them as language,
 *     never as the raw code.
 */
export class ChallengeView {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) title: string | null;
  @ApiProperty({ enum: ChallengeStatus }) status: ChallengeStatus;
  @ApiProperty({ nullable: true }) primaryDomain: string | null;
  @ApiProperty({ nullable: true }) theme: string | null;
  @ApiProperty({ nullable: true }) mode: string | null;
  @ApiProperty({ nullable: true }) urgency: string | null;
  @ApiProperty() contextVersion: number;
  @ApiProperty() version: number;
  @ApiProperty() openedAt: string;
  @ApiProperty({ nullable: true }) resolvedAt: string | null;

  static from(challenge: ZunoChallenge): ChallengeView {
    return {
      id: challenge.id,
      title: challenge.title,
      status: challenge.status,
      primaryDomain: challenge.primary_domain,
      theme: challenge.theme,
      mode: challenge.mode,
      urgency: challenge.urgency,
      contextVersion: challenge.context_version,
      version: challenge.version,
      openedAt: challenge.opened_at.toISOString(),
      resolvedAt: challenge.resolved_at
        ? challenge.resolved_at.toISOString()
        : null,
    };
  }
}

/**
 * Detailed view, including the current understanding.
 *
 * Step 11 Rule 5: internal confidence scores and engine routing never reach
 * normal consumer UX, so neither appears here even though both are stored.
 * `clarificationRequired` is exposed because the client legitimately needs to
 * know whether ZUNO is still asking.
 */
export class ChallengeDetailView extends ChallengeView {
  @ApiProperty({ nullable: true }) summary: string | null;
  @ApiProperty() clarificationRequired: boolean;
  @ApiProperty({ type: [String] }) understood: string[];
  @ApiProperty({ type: [String] }) concerns: string[];

  static fromDetail(
    challenge: ZunoChallenge,
    context: ZunoChallengeContext | null,
  ): ChallengeDetailView {
    const base = ChallengeView.from(challenge);
    const items = context?.payload?.items ?? [];
    return {
      ...base,
      summary: context?.summary ?? null,
      clarificationRequired: context?.clarification_required ?? false,
      understood: items
        .filter((item) => item.type === 'FACT' || item.type === 'EXTERNAL_EVENT')
        .map((item) => item.text),
      concerns: items
        .filter(
          (item) =>
            item.type === 'FEAR' ||
            item.type === 'ASSUMPTION' ||
            item.type === 'USER_BELIEF',
        )
        .map((item) => item.text),
    };
  }
}

/** Step 21 sections 28-29: the adaptive response contract. */
export class ZunoResponseView {
  @ApiProperty() responseId: string;
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty() title: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  sections: unknown[];
  @ApiProperty() generatedAt: string;

  static from(response: ZunoResponse): ZunoResponseView {
    return {
      responseId: response.id,
      challengeId: response.challenge_id,
      title: response.structured_payload.title,
      sections: response.structured_payload.sections,
      generatedAt: response.created_at.toISOString(),
    };
  }
}
