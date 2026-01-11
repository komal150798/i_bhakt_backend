import { Admin } from './admin.entity';
export declare class AppConfig {
    id: number;
    key: string;
    value: string;
    description: string;
    updated_by_admin_id: number;
    updated_by: Admin;
    created_at: Date;
    updated_at: Date;
}
