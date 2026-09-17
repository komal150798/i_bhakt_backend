import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ZunoMemory } from '../entities/zuno-memory.entity';
import { ZunoMemoryCandidate } from '../entities/zuno-memory-candidate.entity';
import { MemoryScope, MemoryType } from '../enums/memory.enum';

/**
 * Step 21 section 58-59. The response shape is fixed by the contract:
 * `{ id, type, label, value, scope, challengeId }`.
 *
 * The section ends with an instruction that shapes this whole file:
 * "Do not expose embeddings, hidden prompts or internal reasoning." So the view
 * models below are explicit projections - never the entity - and they omit
 * confidence, evidence type, source, supersession pointers and every other
 * internal governance field. Those exist so ZUNO can reason about its own
 * memory; showing them to the user would be showing the machinery rather than
 * the memory.
 */

export class ListMemoryQueryDto {
  @ApiPropertyOptional({ enum: MemoryType })
  @IsOptional()
  @IsEnum(MemoryType)
  type?: MemoryType;

  @ApiPropertyOptional({ description: 'Limit to one challenge.' })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ enum: MemoryScope })
  @IsOptional()
  @IsEnum(MemoryScope)
  scope?: MemoryScope;
}

/**
 * Step 21 section 58 / Step 18 section 90: PATCH is correction.
 *
 * There is no `status` or `confidence` field on purpose. A client must not be
 * able to set a memory ACTIVE, raise its confidence or rewrite its provenance -
 * Step 18 section 85 puts all of that on the deterministic backend side. The
 * only thing a user can change is what ZUNO believes to be true, in their own
 * words.
 */
export class CorrectMemoryDto {
  @ApiProperty({
    description: 'What is actually true, in the user\'s own words.',
    example: 'I decided to stay in Dubai as long as my job is stable.',
  })
  @IsString()
  @Length(1, 2000)
  statement: string;

  @ApiPropertyOptional({ description: 'Short label for the memory screen.' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  label?: string;

  /** Step 21 section 108: stale write yields 409 rather than overwriting. */
  @ApiPropertyOptional({ description: 'Version the client last saw.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

export class RejectCandidateDto {
  @ApiPropertyOptional({
    description: 'Optional note. Not stored as memory content.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}

/** Step 21 section 59, exactly. */
export class MemoryView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: MemoryType }) type: MemoryType;
  @ApiProperty() label: string;
  @ApiProperty() value: string;
  @ApiProperty({ enum: MemoryScope }) scope: MemoryScope;
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty({ description: 'Why ZUNO keeps this.' }) why: string;
  @ApiProperty({ nullable: true }) expiresAt: string | null;
  @ApiProperty() version: number;

  static from(memory: ZunoMemory, why: string): MemoryView {
    return {
      id: memory.id,
      type: memory.memory_type,
      label: memory.memory_value?.label ?? defaultLabel(memory.memory_type),
      value: memory.memory_value?.statement ?? '',
      scope: memory.scope,
      challengeId: memory.challenge_id,
      why,
      expiresAt: memory.expires_at ? memory.expires_at.toISOString() : null,
      version: memory.version,
    };
  }
}

/**
 * A memory ZUNO would like to keep but will not keep without being told.
 *
 * Step 18 sections 24, 30 and 51: personalization should be transparent, and an
 * inference below the confidence bar is presented as a question rather than
 * asserted as a fact.
 */
export class MemoryCandidateView {
  @ApiProperty() id: string;
  @ApiProperty({ enum: MemoryType }) type: MemoryType;
  @ApiProperty() proposed: string;
  @ApiProperty({ nullable: true }) challengeId: string | null;
  @ApiProperty({
    description: 'Why ZUNO is asking rather than assuming.',
  })
  askingBecause: string;

  static from(candidate: ZunoMemoryCandidate): MemoryCandidateView {
    return {
      id: candidate.id,
      type: candidate.memory_type,
      proposed: candidate.proposed_value?.statement ?? '',
      challengeId: candidate.challenge_id,
      askingBecause: askingBecause(candidate.confirmation_reason),
    };
  }
}

export class MemorySummaryView {
  @ApiProperty() type: string;
  @ApiProperty() label: string;
  @ApiProperty({ type: [Object] }) items: unknown[];
}

/**
 * Plain-language rendering of the confirmation reason.
 *
 * Step 21 section 119 keeps machine codes and user copy separate, and
 * Step 18 section 51 asks for transparency the user can actually act on -
 * "LOW_CONFIDENCE_INFERENCE" is not that.
 */
function askingBecause(reason: string | null): string {
  switch (reason) {
    case 'LOW_CONFIDENCE_INFERENCE':
      return 'ZUNO thinks this might be true but is not sure enough to assume it.';
    case 'SENSITIVE_CLASSIFICATION':
      return 'This is personal enough that ZUNO will not keep it unless you say so.';
    case 'CONTRADICTS_ACTIVE_MEMORY':
      return 'This does not match something ZUNO already had. Which one is right?';
    case 'DERIVED_PATTERN':
      return 'ZUNO noticed a pattern across several things. Does it sound right?';
    default:
      return 'ZUNO would like to confirm this before keeping it.';
  }
}

function defaultLabel(type: MemoryType): string {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
