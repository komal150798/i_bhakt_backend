import { Repository } from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { AdmRole } from '../entities/adm-role.entity';
import { CreateAdminUserDto } from '../dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dtos/update-admin-user.dto';
import { UpdateAdminUserRoleDto } from '../dtos/update-admin-user-role.dto';
export declare class AdminUsersService {
    private adminUserRepository;
    private roleRepository;
    constructor(adminUserRepository: Repository<AdminUser>, roleRepository: Repository<AdmRole>);
    private isSuperAdminRole;
    findAll(dto: {
        page?: number;
        limit?: number;
        search?: string;
        role_id?: number;
        is_enabled?: boolean;
    }): Promise<{
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
    }>;
    findOne(adminId: number): Promise<{
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
    create(createDto: CreateAdminUserDto, addedBy?: number): Promise<{
        admin_id: number;
        username: string;
        email: string;
        role_id: number;
        role_name: string;
        is_enabled: boolean;
    }>;
    update(adminId: number, updateDto: UpdateAdminUserDto, modifiedBy?: number): Promise<{
        admin_id: number;
        username: string;
        email: string;
        role_id: number;
        is_enabled: boolean;
    }>;
    updateRole(adminId: number, updateDto: UpdateAdminUserRoleDto, modifiedBy?: number): Promise<{
        admin_id: number;
        role_id: number;
        role_name: string;
    }>;
}
