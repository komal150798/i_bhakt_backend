import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSmsCredentialDto {
  @ApiProperty({ example: 'TWILIO', description: 'SMS provider name' })
  @IsString()
  provider_name: string;

  @ApiProperty({ example: 'ACxxxxxxxxxxxxx', description: 'API key' })
  @IsString()
  api_key: string;

  @ApiPropertyOptional({ example: 'your-auth-token', description: 'API secret/auth token' })
  @IsOptional()
  @IsString()
  api_secret?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Sender ID or phone number' })
  @IsOptional()
  @IsString()
  sender_id?: string;

  @ApiPropertyOptional({ example: 'https://api.twilio.com', description: 'Base URL for API' })
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



