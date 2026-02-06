import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KarmaTypeInput {
  GOOD = 'good',
  NEUTRAL = 'neutral',
  CHALLENGING = 'challenging',
}

export class RecordKarmaDto {
  @ApiProperty({
    enum: KarmaTypeInput,
    example: 'good',
    description: 'Type of karma action: good, neutral, or challenging',
  })
  @IsEnum(KarmaTypeInput)
  @IsNotEmpty()
  karma_type: KarmaTypeInput;

  @ApiProperty({
    example: 'Helped a colleague with a difficult project without being asked.',
    description: 'Description of the karma action performed',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'Genuine support',
    description: 'Optional intention behind the action',
  })
  @IsOptional()
  @IsString()
  intention?: string;

  @ApiPropertyOptional({
    example: 'Compassion and satisfaction',
    description: 'Optional emotional context of the action',
  })
  @IsOptional()
  @IsString()
  emotional_context?: string;
}
