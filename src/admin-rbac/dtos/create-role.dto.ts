import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Content Admin' })
  @IsString()
  role_name: string;

  @ApiPropertyOptional({ description: 'Role level (lower = higher privilege)', example: 2 })
  @IsOptional()
  @IsInt()
  role_level?: number;

  @ApiPropertyOptional({ description: 'Is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
