import { IsString, IsEmail, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Admin name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Role ID to assign', example: 2 })
  @IsInt()
  role_id: number;

  @ApiPropertyOptional({ description: 'Password (if not provided, default will be set)', example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
