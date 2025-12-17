import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'WELCOME_EMAIL', description: 'Unique template code' })
  @IsString()
  template_code: string;

  @ApiProperty({ example: 'Welcome Email', description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Welcome to iBhakt!', description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ 
    example: '<html><body><h1>Welcome {{name}}!</h1><p>Your account is ready.</p></body></html>',
    description: 'Email body (HTML or text) with {{variables}}' 
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({ default: true, description: 'Is body HTML format' })
  @IsOptional()
  @IsBoolean()
  is_html?: boolean;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true, description: 'Is template active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}



