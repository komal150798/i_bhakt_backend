import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSmsTemplateDto {
  @ApiProperty({ example: 'OTP_LOGIN_SMS', description: 'Unique template code' })
  @IsString()
  template_code: string;

  @ApiProperty({ example: 'OTP Login SMS', description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'Hi {{name}}, your OTP is {{otp}}. Valid for {{minutes}} minutes.',
    description: 'Template body with {{variables}}' 
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true, description: 'Is template active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}



