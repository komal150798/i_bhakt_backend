import { PromptService } from '../prompt.service';
import { CreateAIPromptDto } from '../dtos/create-ai-prompt.dto';
import { UpdateAIPromptDto } from '../dtos/update-ai-prompt.dto';
import { AIPrompt } from '../entities/ai-prompt.entity';
export declare class AdminAIPromptController {
    private readonly promptService;
    constructor(promptService: PromptService);
    listPrompts(scope?: string, type?: string, language?: string, is_active?: string): Promise<{
        success: boolean;
        data: AIPrompt[];
        count: number;
    }>;
    getPrompt(id: string): Promise<{
        success: boolean;
        data: AIPrompt;
    }>;
    createPrompt(createDto: CreateAIPromptDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: AIPrompt;
    }>;
    updatePrompt(id: string, updateDto: UpdateAIPromptDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: AIPrompt;
    }>;
    deletePrompt(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    clearCache(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    clearAllCache(): Promise<{
        success: boolean;
        message: string;
    }>;
}
