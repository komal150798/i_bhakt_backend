import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KarmaCategory } from '../entities/karma-category.entity';
import { KarmaWeightRule } from '../entities/karma-weight-rule.entity';
import { PromptService } from '../../common/ai/prompt.service';
import { LLMService } from '../../common/ai/services/llm.service';
import { ConstantsService } from '../../common/constants/constants.service';
export interface AIClassificationResult {
    type: 'good' | 'bad' | 'neutral';
    confidence: number;
    emotion: string;
    category: string;
    weight: number;
    habit_recommendation: string[];
    pattern_key: string;
    reasoning: string;
}
export declare class AIClassificationService {
    private readonly categoryRepository;
    private readonly weightRuleRepository;
    private readonly promptService;
    private readonly llmService;
    private readonly constantsService;
    private readonly configService;
    private readonly logger;
    private readonly useLLM;
    constructor(categoryRepository: Repository<KarmaCategory>, weightRuleRepository: Repository<KarmaWeightRule>, promptService: PromptService, llmService: LLMService, constantsService: ConstantsService, configService: ConfigService);
    classifyAction(actionText: string, userId?: number): Promise<AIClassificationResult>;
    private classifyWithAI;
    private classifyWithLLM;
    private classifyWithRules;
    private detectEmotion;
    private getHabitRecommendations;
}
