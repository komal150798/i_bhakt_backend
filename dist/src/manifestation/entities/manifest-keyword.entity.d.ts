import { ManifestCategory } from './manifest-category.entity';
import { ManifestSubcategory } from './manifest-subcategory.entity';
export declare class ManifestKeyword {
    id: string;
    keyword: string;
    category_id: string | null;
    subcategory_id: string | null;
    weight: number;
    created_at: Date;
    category: ManifestCategory | null;
    subcategory: ManifestSubcategory | null;
}
