import { Repository } from 'typeorm';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { User } from '../../users/entities/user.entity';
import { AuthJwtService } from './jwt.service';
import { PermissionsService } from '../../admin-rbac/services/permissions.service';
export declare class AdminAuthService {
    private adminUserRepository;
    private userRepository;
    private jwtService;
    private permissionsService;
    constructor(adminUserRepository: Repository<AdminUser>, userRepository: Repository<User>, jwtService: AuthJwtService, permissionsService: PermissionsService);
    login(username: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: number;
            unique_id: string;
            email: string;
            name?: string;
            role: string;
            role_id?: number;
            role_name?: string | null;
            is_master?: boolean;
            permissions: string[];
        };
    }>;
}
