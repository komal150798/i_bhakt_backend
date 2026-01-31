import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddKarmaInputDto {
  @ApiProperty({
    example: 'Helped an elderly person cross the road',
    description: 'Description of the karma action performed',
  })
  @IsString()
  action_text: string;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00Z',
    description: 'Optional timestamp for when the action was performed (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}


