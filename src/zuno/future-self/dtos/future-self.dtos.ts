import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { FutureSelfMode } from '../enums/future-self.enum';
import { ZunoFutureSelfNarrative } from '../entities/zuno-future-self-narrative.entity';

/**
 * Step 21 API Contracts sections 61-62.
 *
 * Request:  `{ challengeId, mode }`
 * Response: `{ id, mode, message, openLoops, nextFocus }`
 *
 * The contract calls the text `message`; the column is `summary` (Step 20
 * section 54). The view is where the two meet, which is the right place - the
 * alternative is renaming one of them and breaking the other document.
 */
export class GenerateFutureSelfDto {
  @ApiPropertyOptional({
    description:
      'The challenge to reflect on. Omit for a whole-life reflection.',
  })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiProperty({ enum: FutureSelfMode, example: FutureSelfMode.WEEKLY })
  @IsEnum(FutureSelfMode)
  mode: FutureSelfMode;
}

export class ListFutureSelfQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ enum: FutureSelfMode })
  @IsOptional()
  @IsEnum(FutureSelfMode)
  mode?: FutureSelfMode;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Step 21 section 62, exactly.
 *
 * Deliberately withheld: `source_refs`. Step 18 section 38 requires the
 * narrative to be grounded and the rows exist to prove it, but listing the
 * internal entity ids back to the client would be showing the machinery -
 * Step 18 section 53 and Rule 13. `sourceCount` conveys that grounding
 * happened without turning the response into a debug view.
 */
export class FutureSelfView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: FutureSelfMode }) mode: FutureSelfMode;
  @ApiProperty({ description: 'What the Future Self says.' }) message: string;
  @ApiProperty({ type: [String] }) progressThemes: string[];
  @ApiProperty({ type: [String] }) openLoops: string[];
  @ApiProperty({ type: [String] }) strengthsObserved: string[];
  @ApiProperty({ type: [String] }) nextFocus: string[];
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty({ nullable: true }) periodStart: string | null;
  @ApiProperty({ nullable: true }) periodEnd: string | null;
  @ApiProperty({ description: 'How many stored facts this rests on.' })
  sourceCount: number;
  @ApiProperty() createdAt: string;

  static from(
    narrative: ZunoFutureSelfNarrative,
    sourceCount: number,
  ): FutureSelfView {
    return {
      id: narrative.id,
      mode: narrative.mode,
      message: narrative.summary,
      progressThemes: narrative.progress_themes ?? [],
      openLoops: narrative.open_loops ?? [],
      strengthsObserved: narrative.strengths_observed ?? [],
      nextFocus: narrative.next_focus ?? [],
      challengeId: narrative.challenge_id,
      periodStart: narrative.period_start,
      periodEnd: narrative.period_end,
      sourceCount,
      createdAt: narrative.created_at
        ? narrative.created_at.toISOString()
        : new Date().toISOString(),
    };
  }
}
