import { BaseEntity } from '../../common/entities/base.entity';
export declare class Testimonial extends BaseEntity {
    name: string;
    avatar_url: string | null;
    location: string | null;
    message: string;
    rating: number;
    category: string;
    is_featured: boolean;
    display_order: number;
}
