import { BaseEntity } from '../../common/entities/base.entity';
export declare class KarmaCategory extends BaseEntity {
    slug: string;
    name: string;
    description: string | null;
    default_type: 'good' | 'bad' | 'neutral';
    is_active: boolean;
    metadata: Record<string, any> | null;
}
