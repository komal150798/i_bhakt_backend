import { ManifestCategory } from './manifest-category.entity';
export declare class ManifestSummaryTemplate {
    id: string;
    category_id: string | null;
    template_text: string;
    priority: number;
    is_active: boolean;
    created_at: Date;
    category: ManifestCategory | null;
}
