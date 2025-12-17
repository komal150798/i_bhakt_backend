import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAIPromptDto {
  @ApiProperty({ description: 'Unique prompt key (e.g., karma.classification.system)' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Scope (e.g., karma, manifestation, user_profile)' })
  @IsString()
  @IsNotEmpty()
  scope: string;

  @ApiPropertyOptional({ description: 'Model hint (e.g., gpt-4.1, gemini-pro)' })
  @IsString()
  @IsOptional()
  model_hint?: string;

  @ApiProperty({ description: 'Prompt type', enum: ['system', 'user', 'tool', 'instruction'] })
  @IsString()
  @IsIn(['system', 'user', 'tool', 'instruction'])
  type: string;

  @ApiPropertyOptional({ description: 'Language code', default: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Prompt template with {{variables}}' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({ description: 'Description for admin UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
