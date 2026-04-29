import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class AddDailyProgressEntryDto {
  @ApiProperty({ description: 'Manifestation ID' })
  @IsNumber()
  manifestation_id: number;

  @ApiProperty({
    description: 'Entry date in YYYY-MM-DD format',
    example: '2026-04-28',
  })
  @IsDateString()
  entry_date: string;

  @ApiProperty({
    description: 'What user did today to complete manifestation',
    example: 'I meditated for 20 minutes and updated my action plan.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  action_text: string;
}

export class UpdateDailyProgressEntryDto {
  @ApiPropertyOptional({
    description: 'Updated action text',
    example: 'I meditated for 30 minutes and wrote gratitude journal.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  action_text?: string;
}
