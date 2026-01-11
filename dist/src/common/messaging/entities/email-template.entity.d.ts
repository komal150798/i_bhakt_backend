import { BaseEntity } from '../../entities/base.entity';
export declare class EmailTemplate extends BaseEntity {
    template_code: string;
    name: string;
    subject: string;
    body: string;
    is_html: boolean;
    description: string | null;
    is_active: boolean;
    created_by: number | null;
    updated_by: number | null;
}
