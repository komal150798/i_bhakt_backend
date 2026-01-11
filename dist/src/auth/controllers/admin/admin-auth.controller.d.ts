import { AdminAuthService } from '../../services/admin-auth.service';
import { AdminLoginDto } from '../../dtos/admin/admin-login.dto';
export declare class AdminAuthController {
    private readonly adminAuthService;
    constructor(adminAuthService: AdminAuthService);
    login(loginDto: AdminLoginDto): Promise<{
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
