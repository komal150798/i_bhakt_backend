"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AIClassificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClassificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const karma_category_entity_1 = require("../entities/karma-category.entity");
const karma_weight_rule_entity_1 = require("../entities/karma-weight-rule.entity");
const prompt_service_1 = require("../../common/ai/prompt.service");
const llm_service_1 = require("../../common/ai/services/llm.service");
const constants_service_1 = require("../../common/constants/constants.service");
let AIClassificationService = AIClassificationService_1 = class AIClassificationService {
    constructor(categoryRepository, weightRuleRepository, promptService, llmService, constantsService, configService) {
        this.categoryRepository = categoryRepository;
        this.weightRuleRepository = weightRuleRepository;
        this.promptService = promptService;
        this.llmService = llmService;
        this.constantsService = constantsService;
        this.configService = configService;
        this.logger = new common_1.Logger(AIClassificationService_1.name);
        const openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.useLLM = !!openaiApiKey;
        if (!this.useLLM) {
            this.logger.warn('LLM API key not found. Karma classification will use rule-based fallback only.');
        }
    }
    async classifyAction(actionText, userId) {
        const normalizedText = actionText.toLowerCase().trim();
        const weightRules = await this.weightRuleRepository.find({
            where: { is_active: true },
        });
        let matchedRule = null;
        let bestMatchScore = 0;
        for (const rule of weightRules) {
            if (rule.keywords && rule.keywords.length > 0) {
                const matchCount = rule.keywords.filter((keyword) => normalizedText.includes(keyword.toLowerCase())).length;
                const matchScore = matchCount / rule.keywords.length;
                if (matchScore > bestMatchScore && matchScore > 0.3) {
                    bestMatchScore = matchScore;
                    matchedRule = rule;
                }
            }
        }
        if (!matchedRule) {
            return this.classifyWithAI(normalizedText, userId);
        }
        const calculatedWeight = Number(matchedRule.base_weight);
        const habitRecommendations = await this.getHabitRecommendations(matchedRule.pattern_key);
        const confidence = Math.min(100, Math.round(bestMatchScore * 100 + 50));
        return {
            type: matchedRule.karma_type,
            confidence,
            emotion: matchedRule.pattern_key,
            category: matchedRule.category_slug,
            weight: calculatedWeight,
            habit_recommendation: habitRecommendations,
            pattern_key: matchedRule.pattern_key,
            reasoning: `Matched pattern "${matchedRule.pattern_name}" based on keyword analysis with ${Math.round(bestMatchScore * 100)}% match.`,
        };
    }
    async classifyWithAI(text, userId) {
        if (this.useLLM) {
            try {
                return await this.classifyWithLLM(text, userId);
            }
            catch (error) {
                this.logger.warn('LLM classification failed, using rule-based fallback', error);
            }
        }
        return await this.classifyWithRules(text);
    }
    async classifyWithLLM(text, userId) {
        const systemPrompt = await this.promptService.getPrompt('karma.classification.system.gpt5.1', {});
        const userPrompt = await this.promptService.getPrompt('karma.classification.user.gpt5.1', {
            action_text: text,
            user_id: userId?.toString() || 'unknown',
            current_date: new Date().toISOString().split('T')[0],
        });
        const llmResponse = await this.llmService.callLLMJSON({
            systemPrompt: systemPrompt.finalText,
            userPrompt: userPrompt.finalText,
            maxTokens: 500,
            temperature: 0.7,
        });
        const classification = llmResponse.data;
        const habitRecommendations = await this.getHabitRecommendations(classification.pattern_key || classification.emotion);
        return {
            type: classification.type || 'neutral',
            confidence: Math.round((classification.confidence || 0.5) * 100),
            emotion: classification.emotion || 'neutral',
            category: classification.category || 'general',
            weight: classification.weight || 0,
            habit_recommendation: habitRecommendations,
            pattern_key: classification.pattern_key || classification.emotion || 'neutral',
            reasoning: classification.reasoning || 'LLM classification',
        };
    }
    async classifyWithRules(text) {
        const positiveKeywords = await this.constantsService.getPositiveKeywords();
        const negativeKeywords = await this.constantsService.getNegativeKeywords();
        const positiveCount = positiveKeywords.filter((kw) => text.includes(kw.toLowerCase())).length;
        const negativeCount = negativeKeywords.filter((kw) => text.includes(kw.toLowerCase())).length;
        let type = 'neutral';
        let confidence = 50;
        let emotion = 'neutral';
        let weight = 0;
        if (positiveCount > negativeCount && positiveCount > 0) {
            type = 'good';
            confidence = Math.min(100, 60 + positiveCount * 10);
            emotion = this.detectEmotion(text, 'positive');
            weight = 10 + positiveCount * 5;
        }
        else if (negativeCount > positiveCount && negativeCount > 0) {
            type = 'bad';
            confidence = Math.min(100, 60 + negativeCount * 10);
            emotion = this.detectEmotion(text, 'negative');
            weight = -(10 + negativeCount * 5);
        }
        const habitRecommendations = await this.getHabitRecommendations(emotion);
        return {
            type,
            confidence,
            emotion,
            category: 'general',
            weight,
            habit_recommendation: habitRecommendations,
            pattern_key: emotion,
            reasoning: `Rule-based classification: ${positiveCount} positive indicators, ${negativeCount} negative indicators.`,
        };
    }
    detectEmotion(text, sentiment) {
        if (sentiment === 'positive') {
            if (text.includes('help') || text.includes('support'))
                return 'kindness';
            if (text.includes('learn') || text.includes('study'))
                return 'discipline';
            if (text.includes('donate') || text.includes('give'))
                return 'generosity';
            if (text.includes('meditate') || text.includes('mindful'))
                return 'mindfulness';
            return 'kindness';
        }
        else {
            if (text.includes('anger') || text.includes('angry') || text.includes('rage'))
                return 'anger';
            if (text.includes('lazy') || text.includes('procrastinate'))
                return 'laziness';
            if (text.includes('lie') || text.includes('cheat') || text.includes('dishonest'))
                return 'dishonesty';
            if (text.includes('selfish') || text.includes('greed'))
                return 'ego';
            return 'negative';
        }
    }
    async getHabitRecommendations(patternKey) {
        const defaultHabits = {
            anger: [
                'Daily meditation 10 mins',
                'Pause before reacting',
                'Journaling before sleep',
            ],
            laziness: [
                'Pomodoro technique',
                'Morning routine setup',
                'Daily task list at night',
            ],
            dishonesty: [
                'Truth journaling',
                'Mindfulness check-in',
                'Accountability partner',
            ],
            kindness: [
                'Daily act of kindness',
                'Volunteer weekly',
                'Express gratitude daily',
            ],
            discipline: [
                'Morning routine',
                'Time blocking',
                'Goal setting',
            ],
        };
        return defaultHabits[patternKey] || ['Daily mindfulness practice', 'Reflection journaling'];
    }
};
exports.AIClassificationService = AIClassificationService;
exports.AIClassificationService = AIClassificationService = AIClassificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(karma_category_entity_1.KarmaCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(karma_weight_rule_entity_1.KarmaWeightRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        prompt_service_1.PromptService,
        llm_service_1.LLMService,
        constants_service_1.ConstantsService,
        config_1.ConfigService])
], AIClassificationService);
//# sourceMappingURL=ai-classification.service.js.map