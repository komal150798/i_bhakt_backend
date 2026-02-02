import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateResonanceDto {
  @ApiProperty({
    example: 'I want to find a fulfilling job that aligns with my values and allows me to grow professionally.',
    description: 'Manifestation description text for resonance calculation',
    minLength: 15,
  })
  @IsString()
  @MinLength(15)
  description: string;
}




