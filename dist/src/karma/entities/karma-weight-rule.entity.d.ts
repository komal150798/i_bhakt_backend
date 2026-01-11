import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaWeightRule extends BaseEntity {
    category_slug: string;
    pattern_key: string;
    pattern_name: string;
    karma_type: 'good' | 'bad' | 'neutral';
    base_weight: number;
    intensity_multiplier: number;
    description: string | null;
    keywords: string[] | null;
    is_active: boolean;
    metadata: Record<string, any> | null;
}
