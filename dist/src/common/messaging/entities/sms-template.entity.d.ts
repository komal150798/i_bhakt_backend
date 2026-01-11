import { BaseEntity } from '../../entities/base.entity';
export declare class SmsTemplate extends BaseEntity {
    template_code: string;
    name: string;
    body: string;
    description: string | null;
    is_active: boolean;
    created_by: number | null;
    updated_by: number | null;
}
