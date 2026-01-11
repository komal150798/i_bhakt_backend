import { BaseEntity } from '../../common/entities/base.entity';
import { ModuleType } from '../../common/enums/module-type.enum';
import { Plan } from '../../plans/entities/plan.entity';
export declare class Module extends BaseEntity {
    module_type: ModuleType;
    name: string;
    slug: string;
    description: string | null;
    icon_name: string | null;
    route_path: string | null;
    image_url: string | null;
    badge_color: string | null;
    sort_order: number;
    is_premium: boolean;
    required_permissions: string[] | null;
    metadata: Record<string, any> | null;
    plans: Plan[];
}
