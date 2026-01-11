import { CreateAIPromptDto } from './create-ai-prompt.dto';
declare const UpdateAIPromptDto_base: import("@nestjs/common").Type<Partial<CreateAIPromptDto>>;
export declare class UpdateAIPromptDto extends UpdateAIPromptDto_base {
    model_hint?: string;
    type?: string;
    language?: string;
    template?: string;
    description?: string;
    is_active?: boolean;
}
export {};
