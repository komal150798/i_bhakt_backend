declare class PermissionUpdateDto {
    permission_id: number;
    is_allowed: boolean;
}
export declare class UpdateRolePermissionsDto {
    permissions: PermissionUpdateDto[];
}
export {};
