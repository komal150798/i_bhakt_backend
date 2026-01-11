import { Admin } from './admin.entity';
export declare class PlanFeatureLimit {
    id: number;
    plan: string;
    feature: string;
    max_per_day: number;
    max_per_week: number;
    max_per_month: number;
    karma_ledger_visible: boolean;
    cosmic_blueprint_visible: boolean;
    updated_by_admin_id: number;
    updated_by: Admin;
    created_at: Date;
    updated_at: Date;
}
