import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for adding selected alignment actions to karma ledger
 */
export class AddAlignmentActionsDto {
  @ApiProperty({ description: 'Manifestation ID' })
  @IsNumber()
  @IsNotEmpty()
  manifestation_id: number;

  @ApiProperty({
    description: 'Array of selected alignment action IDs',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  action_ids: number[];
}

/**
 * DTO for committing manifestation intention
 */
export class CommitIntentionDto {
  @ApiProperty({ description: 'Manifestation ID' })
  @IsNumber()
  @IsNotEmpty()
  manifestation_id: number;

  @ApiPropertyOptional({ description: 'Optional commitment message' })
  @IsOptional()
  @IsString()
  commitment_message?: string;

  @ApiPropertyOptional({ description: 'Target date for manifestation (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  target_date?: string;
}
