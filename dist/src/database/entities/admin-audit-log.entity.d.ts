import { Admin } from './admin.entity';
export declare class AdminAuditLog {
    id: number;
    admin_id: number;
    admin: Admin;
    action: string;
    resource_type: string;
    resource_id: number;
    details: string;
    ip_address: string;
    user_agent: string;
    created_at: Date;
}
