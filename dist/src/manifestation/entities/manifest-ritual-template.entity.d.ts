import { ManifestCategory } from './manifest-category.entity';
import { ManifestSubcategory } from './manifest-subcategory.entity';
export declare class ManifestRitualTemplate {
    id: string;
    category_id: string | null;
    subcategory_id: string | null;
    template_text: string;
    priority: number;
    is_active: boolean;
    created_at: Date;
    category: ManifestCategory | null;
    subcategory: ManifestSubcategory | null;
}
