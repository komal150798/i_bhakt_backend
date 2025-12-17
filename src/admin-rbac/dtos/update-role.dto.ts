import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  role_name?: string;

  @ApiPropertyOptional({ description: 'Role level' })
  @IsOptional()
  @IsInt()
  role_level?: number;

  @ApiPropertyOptional({ description: 'Is enabled' })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
