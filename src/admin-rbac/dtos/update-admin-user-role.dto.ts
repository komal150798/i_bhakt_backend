import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminUserRoleDto {
  @ApiProperty({ description: 'Role ID to assign', example: 2 })
  @IsInt()
  role_id: number;
}
