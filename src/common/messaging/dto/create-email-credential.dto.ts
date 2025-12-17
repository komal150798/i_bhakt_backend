import { IsString, IsOptional, IsBoolean, IsEmail, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailCredentialDto {
  @ApiProperty({ example: 'MAILGUN', description: 'Email provider name' })
  @IsString()
  provider_name: string;

  @ApiProperty({ example: 'key-xxxxxxxxxxxxx', description: 'API key' })
  @IsString()
  api_key: string;

  @ApiPropertyOptional({ example: 'mg.example.com', description: 'Domain (for Mailgun)' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'noreply@example.com', description: 'From email address' })
  @IsEmail()
  from_email: string;

  @ApiPropertyOptional({ example: 'iBhakt', description: 'From name' })
  @IsOptional()
  @IsString()
  from_name?: string;

  @ApiPropertyOptional({ example: 'https://api.mailgun.net/v3', description: 'Base URL for API' })
  @IsOptional()
  @IsString()
  base_url?: string;

  @ApiPropertyOptional({ description: 'Additional configuration' })
  @IsOptional()
  @IsObject()
  extra_config?: Record<string, any>;

  @ApiPropertyOptional({ default: false, description: 'Set as active credential' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}



