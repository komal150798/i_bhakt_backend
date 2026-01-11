export declare class CreateSmsCredentialDto {
    provider_name: string;
    api_key: string;
    api_secret?: string;
    sender_id?: string;
    base_url?: string;
    extra_config?: Record<string, any>;
    is_active?: boolean;
}
