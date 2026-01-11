import { AdminUsersService } from '../services/admin-users.service';
import { CreateAdminUserDto } from '../dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dtos/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from '../dtos/update-admin-user-role.dto';
import { ListAdminUsersDto } from '../dtos/list-admin-users.dto';
export declare class AdminUsersController {
    private readonly adminUsersService;
    constructor(adminUsersService: AdminUsersService);
    findAll(dto: ListAdminUsersDto): Promise<{
        data: {
            admin_id: number;
            unique_id: string;
            username: string;
            name: string;
            first_name: string;
            last_name: string;
            email: string;
            role_id: number;
            role_name: string;
            is_enabled: boolean;
            is_active: boolean;
            last_login_at: Date;
            added_date: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        success: boolean;
    }>;
    findOne(id: number): Promise<{
        admin_id: number;
        unique_id: string;
        username: string;
        name: string;
        first_name: string;
        last_name: string;
        email: string;
        role_id: number;
        role_name: string;
        is_enabled: boolean;
        is_active: boolean;
        last_login_at: Date;
        last_login_ip: string;
        added_date: Date;
    }>;
    create(createDto: CreateAdminUserDto, user: any): Promise<{
        admin_id: number;
        username: string;
        email: string;
        role_id: number;
        role_name: string;
        is_enabled: boolean;
    }>;
    update(id: number, updateDto: UpdateAdminUserDto, user: any): Promise<{
        admin_id: number;
        username: string;
        email: string;
        role_id: number;
        is_enabled: boolean;
    }>;
    updateRole(id: number, updateDto: UpdateAdminUserRoleDto, user: any): Promise<{
        admin_id: number;
        role_id: number;
        role_name: string;
    }>;
}
