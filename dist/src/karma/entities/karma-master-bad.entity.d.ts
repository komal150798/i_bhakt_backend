import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaMasterBad extends BaseEntity {
    text: string;
    category_slug: string | null;
    category_name: string | null;
    weight: number;
    match_count: number;
    metadata: Record<string, any> | null;
}
