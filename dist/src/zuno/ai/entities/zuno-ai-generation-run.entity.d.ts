import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
export declare class ZunoAiGenerationRun extends ZunoImmutableEntity {
    user_id: string | null;
    challenge_id: string | null;
    operation_type: string;
    model_provider: string;
    model_name: string;
    model_version: string | null;
    prompt_template_version: string;
    input_reference: {
        input_hash: string;
        challenge_id?: string;
        context_version?: number;
        input_chars: number;
    };
    output_reference: {
        artifact_type?: string;
        artifact_id?: string;
        schema_valid: boolean;
        validation_errors?: string[];
    } | null;
    status: 'SUCCESS' | 'SCHEMA_INVALID' | 'TIMEOUT' | 'PROVIDER_ERROR' | 'BLOCKED';
    latency_ms: number | null;
    attempt_count: number;
    token_usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    } | null;
}
