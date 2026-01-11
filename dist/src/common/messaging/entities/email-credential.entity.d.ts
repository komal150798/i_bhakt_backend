import { BaseEntity } from '../../entities/base.entity';
export declare class EmailCredential extends BaseEntity {
    provider_name: string;
    api_key: string;
    domain: string | null;
    from_email: string;
    from_name: string | null;
    base_url: string | null;
    extra_config: Record<string, any> | null;
    is_active: boolean;
    created_by: number | null;
    updated_by: number | null;
}
