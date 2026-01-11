import { BaseEntity } from '../../entities/base.entity';
export declare class SmsCredential extends BaseEntity {
    provider_name: string;
    api_key: string;
    api_secret: string | null;
    sender_id: string | null;
    base_url: string | null;
    extra_config: Record<string, any> | null;
    is_active: boolean;
    created_by: number | null;
    updated_by: number | null;
}
