import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManifestationDto {
  @ApiProperty({ 
    example: 'I want to find a fulfilling job that aligns with my values',
    description: 'Manifestation desire text',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  title: string; // Using 'title' to match mobile doc format, maps to desire_text

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}



