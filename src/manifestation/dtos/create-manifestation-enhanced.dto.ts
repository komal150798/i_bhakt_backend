import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateManifestationEnhancedDto {
  @ApiProperty({
    example: 'I want to find a fulfilling job that aligns with my values and allows me to grow professionally while making a positive impact.',
    description: 'Manifestation intention text. Title, category, emotional state and all scores will be auto-detected from this text based on your kundli.',
    minLength: 15,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(15)
  @MaxLength(2000)
  description: string;
}
