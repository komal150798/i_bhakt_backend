import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JournalEntryType {
  GRATITUDE = 'gratitude',
  REFLECTION = 'reflection',
  GOAL = 'goal',
  GENERAL = 'general',
  LEDGER = 'ledger', // For karma ledger entries
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: 'Today I helped a friend in need...', description: 'Journal entry content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '2024-01-15', description: 'Entry date (defaults to today)' })
  @IsOptional()
  @IsDateString()
  entry_date?: string;

  @ApiPropertyOptional({ 
    enum: JournalEntryType,
    example: JournalEntryType.GENERAL,
    description: 'Type of journal entry' 
  })
  @IsOptional()
  @IsEnum(JournalEntryType)
  entry_type?: JournalEntryType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}



