import { BaseEntity } from '../../common/entities/base.entity';
import { CMSPageType } from '../../common/enums/cms-page-type.enum';
export declare class CMSPage extends BaseEntity {
    slug: string;
    title: string;
    description: string | null;
    content: string | null;
    page_type: CMSPageType;
    meta_title: string | null;
    meta_description: string | null;
    featured_image: string | null;
    is_published: boolean;
    published_at: Date | null;
    view_count: number;
    metadata: Record<string, any> | null;
}
