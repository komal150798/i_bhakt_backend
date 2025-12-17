import { IsString, IsOptional, MinLength, MaxLength, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ManifestationCategory {
  RELATIONSHIP = 'relationship',
  CAREER = 'career',
  MONEY = 'money',
  HEALTH = 'health',
  SPIRITUAL = 'spiritual',
}

export enum EmotionalState {
  GRATEFUL = 'grateful',
  HOPEFUL = 'hopeful',
  CONFIDENT = 'confident',
  ANXIOUS = 'anxious',
  FRUSTRATED = 'frustrated',
  PEACEFUL = 'peaceful',
  EXCITED = 'excited',
}

export class CreateManifestationEnhancedDto {
  @ApiProperty({
    example: 'Find my dream job in tech',
    description: 'Manifestation title',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'I want to find a fulfilling job that aligns with my values and allows me to grow professionally while making a positive impact.',
    description: 'Detailed description of the manifestation intent',
    minLength: 15,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(15)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    enum: ManifestationCategory,
    description: 'Category of manifestation',
  })
  @IsOptional()
  @IsEnum(ManifestationCategory)
  category?: ManifestationCategory;

  @ApiPropertyOptional({
    enum: EmotionalState,
    description: 'Current emotional state',
  })
  @IsOptional()
  @IsEnum(EmotionalState)
  emotional_state?: EmotionalState;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Target date for manifestation (optional)',
  })
  @IsOptional()
  @IsDateString()
  target_date?: string;
}


