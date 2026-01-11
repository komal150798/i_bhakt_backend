export declare class CreateEmailCredentialDto {
    provider_name: string;
    api_key: string;
    domain?: string;
    from_email: string;
    from_name?: string;
    base_url?: string;
    extra_config?: Record<string, any>;
    is_active?: boolean;
}
