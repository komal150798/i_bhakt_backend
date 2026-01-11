import { AdminAuditLog } from './admin-audit-log.entity';
import { AppConfig } from './app-config.entity';
import { PlanFeatureLimit } from './plan-feature-limit.entity';
export declare class Admin {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    is_super_admin: boolean;
    created_at: Date;
    updated_at: Date;
    audit_logs: AdminAuditLog[];
    updated_configs: AppConfig[];
    updated_limits: PlanFeatureLimit[];
}
