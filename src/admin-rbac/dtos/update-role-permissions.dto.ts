import { IsArray, ValidateNested, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PermissionUpdateDto {
  @ApiProperty({ description: 'Permission ID' })
  @IsInt()
  permission_id: number;

  @ApiProperty({ description: 'Is allowed for this role' })
  @IsBoolean()
  is_allowed: boolean;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [PermissionUpdateDto], description: 'List of permissions to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionUpdateDto)
  permissions: PermissionUpdateDto[];
}
