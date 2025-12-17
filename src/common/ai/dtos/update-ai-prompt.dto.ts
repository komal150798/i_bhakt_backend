import { PartialType } from '@nestjs/swagger';
import { CreateAIPromptDto } from './create-ai-prompt.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAIPromptDto extends PartialType(CreateAIPromptDto) {
  @ApiPropertyOptional({ description: 'Model hint (e.g., gpt-4.1, gemini-pro)' })
  @IsString()
  @IsOptional()
  model_hint?: string;

  @ApiPropertyOptional({ description: 'Prompt type', enum: ['system', 'user', 'tool', 'instruction'] })
  @IsString()
  @IsIn(['system', 'user', 'tool', 'instruction'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Language code' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Prompt template with {{variables}}' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ description: 'Description for admin UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  is_active?: boolean;
}
