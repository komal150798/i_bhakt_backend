import { ManifestSubcategory } from './manifest-subcategory.entity';
import { ManifestKeyword } from './manifest-keyword.entity';
import { ManifestRitualTemplate } from './manifest-ritual-template.entity';
import { ManifestToManifestTemplate } from './manifest-to-manifest-template.entity';
import { ManifestNotToManifestTemplate } from './manifest-not-to-manifest-template.entity';
import { ManifestAlignmentTemplate } from './manifest-alignment-template.entity';
import { ManifestInsightTemplate } from './manifest-insight-template.entity';
import { ManifestSummaryTemplate } from './manifest-summary-template.entity';
export declare class ManifestCategory {
    id: string;
    slug: string;
    label: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    subcategories: ManifestSubcategory[];
    keywords: ManifestKeyword[];
    ritual_templates: ManifestRitualTemplate[];
    to_manifest_templates: ManifestToManifestTemplate[];
    not_to_manifest_templates: ManifestNotToManifestTemplate[];
    alignment_templates: ManifestAlignmentTemplate[];
    insight_templates: ManifestInsightTemplate[];
    summary_templates: ManifestSummaryTemplate[];
}
