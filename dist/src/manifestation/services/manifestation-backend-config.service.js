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
var ManifestationBackendConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationBackendConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const manifestation_db_config_service_1 = require("./manifestation-db-config.service");
let ManifestationBackendConfigService = ManifestationBackendConfigService_1 = class ManifestationBackendConfigService {
    constructor(configService, dbConfigService) {
        this.configService = configService;
        this.dbConfigService = dbConfigService;
        this.logger = new common_1.Logger(ManifestationBackendConfigService_1.name);
        this.dbConfigCache = null;
        this.useDatabase = true;
        this.useDatabase = !!this.dbConfigService;
    }
    async getBackendConfig() {
        if (this.useDatabase && this.dbConfigService) {
            try {
                const dbConfig = await this.dbConfigService.getBackendConfig();
                const transformed = this.transformDbConfigToBackendConfig(dbConfig);
                this.dbConfigCache = transformed;
                return transformed;
            }
            catch (error) {
                this.logger.warn('Failed to load config from database, using static fallback', error);
                this.useDatabase = false;
            }
        }
        return this.getStaticBackendConfig();
    }
    getBackendConfigSync() {
        if (this.dbConfigCache) {
            return this.dbConfigCache;
        }
        return this.getStaticBackendConfig();
    }
    transformDbConfigToBackendConfig(dbConfig) {
        return {
            categories: dbConfig.categories || [],
            fallback_category: dbConfig.fallback_category || 'other',
            category_keywords: dbConfig.category_keywords || {},
            energy_rules: dbConfig.energy_rules || {},
            ritual_templates: dbConfig.ritual_templates || [],
            what_to_manifest_templates: dbConfig.to_manifest_templates || [],
            what_not_to_manifest_templates: dbConfig.not_to_manifest_templates || [],
            thought_alignment_templates: dbConfig.alignment_templates || [],
            insight_templates: dbConfig.insight_templates || [],
            summary_template: dbConfig.summary_templates?.[0]?.pattern || 'Your manifestation is currently {{energy_state}}. Focus on {{main_focus}}.',
            scoring_rules: {
                resonance_base: 40,
                alignment_base: 40,
                antrashaakti_base: 40,
                mahaadha_base: 0,
                word_count_bonus_per_10_words: 1,
                positive_keyword_bonus: 6,
                negative_keyword_penalty: 5,
                clarity_bonus: 10,
                specificity_bonus: 10,
            },
            language_rules: {
                default: 'en',
                supported: ['en'],
            },
        };
    }
    getStaticBackendConfig() {
        return {
            categories: [
                { id: 'love', label: 'Love & Relationships', subcategories: ['romance', 'marriage', 'dating', 'family_love'] },
                { id: 'career', label: 'Career & Work', subcategories: ['job', 'promotion', 'business', 'skills'] },
                { id: 'health', label: 'Health & Wellbeing', subcategories: ['fitness', 'healing', 'mental_health', 'energy'] },
                { id: 'wealth', label: 'Wealth & Abundance', subcategories: ['money', 'financial_freedom', 'investment', 'prosperity'] },
                { id: 'family', label: 'Family & Home', subcategories: ['relationships', 'harmony', 'support', 'connection'] },
                { id: 'friendship', label: 'Friendship & Social', subcategories: ['friends', 'community', 'social', 'networking'] },
                { id: 'self_growth', label: 'Self Growth & Development', subcategories: ['confidence', 'skills', 'learning', 'transformation'] },
                { id: 'spirituality', label: 'Spirituality & Enlightenment', subcategories: ['meditation', 'prayer', 'divine', 'karma', 'dharma'] },
                { id: 'creativity', label: 'Creativity & Expression', subcategories: ['art', 'music', 'writing', 'talent'] },
                { id: 'other', label: 'Other', subcategories: [] },
            ],
            fallback_category: 'other',
            category_keywords: {
                love: ['love', 'partner', 'relationship', 'marriage', 'dating', 'romance', 'soulmate', 'boyfriend', 'girlfriend', 'husband', 'wife', 'romantic', 'affection', 'marry', 'wedding', 'engaged', 'fiancé', 'fiancée', 'date', 'couple', 'spouse'],
                relationship: ['love', 'partner', 'relationship', 'marriage', 'dating', 'romance', 'soulmate', 'boyfriend', 'girlfriend', 'husband', 'wife', 'romantic', 'affection', 'marry', 'wedding', 'engaged', 'fiancé', 'fiancée', 'date', 'couple', 'spouse'],
                career: ['job', 'career', 'work', 'employment', 'profession', 'business', 'promotion', 'salary', 'office', 'colleague', 'boss', 'workplace', 'professional'],
                health: ['health', 'healthy', 'fitness', 'exercise', 'weight', 'diet', 'illness', 'disease', 'pain', 'healing', 'recovery', 'wellness', 'wellbeing'],
                wealth: ['money', 'wealth', 'rich', 'financial', 'income', 'salary', 'savings', 'investment', 'debt', 'loan', 'abundance', 'prosperity', 'finances'],
                family: ['family', 'parent', 'child', 'son', 'daughter', 'mother', 'father', 'sibling', 'home', 'household', 'relatives'],
                friendship: ['friend', 'friendship', 'social', 'companion', 'buddy', 'pal', 'circle', 'community', 'socializing'],
                self_growth: ['growth', 'improve', 'develop', 'learn', 'skill', 'ability', 'confidence', 'self', 'personal', 'development', 'transformation'],
                spirituality: ['spiritual', 'spirituality', 'enlightenment', 'meditation', 'prayer', 'god', 'divine', 'soul', 'karma', 'dharma', 'sacred', 'blessing'],
                creativity: ['creative', 'art', 'music', 'write', 'paint', 'design', 'express', 'talent', 'artistic', 'expression'],
            },
            energy_rules: {
                aligned: {
                    patterns: ['confident', 'clear', 'focused', 'determined', 'positive', 'grateful', 'ready', 'excited', 'motivated'],
                    description: 'Clear intention with positive emotional charge',
                },
                scattered: {
                    patterns: ['many', 'multiple', 'various', 'different', 'several', 'too many', 'confused', 'unclear'],
                    description: 'Multiple unrelated goals or lack of focus',
                },
                blocked: {
                    patterns: ['cannot', 'impossible', 'never', 'always fail', 'too hard', 'afraid', 'scared', 'worried', 'fear', 'doubt', 'worry'],
                    description: 'Fear, resistance, or strong limiting beliefs detected',
                },
                doubtful: {
                    patterns: ['maybe', 'hopefully', 'if only', 'wish', 'try', 'attempt', 'perhaps', 'might', 'uncertain'],
                    description: 'Uncertainty or low self-belief about achieving the manifestation',
                },
                burned_out: {
                    patterns: ['tired', 'exhausted', 'drained', 'giving up', 'too much effort', 'overwhelmed', 'stressed'],
                    description: 'Fatigue or over-efforting, draining joy and energy',
                },
            },
            ritual_templates: [
                {
                    pattern: 'Create a vision board focusing on {{user_goal}} in the area of {{category_label}}',
                    category: 'all',
                },
                {
                    pattern: 'Practice daily {{category_specific_action}} to align with your intention around {{user_focus}}',
                    category: 'all',
                },
                {
                    pattern: 'Write affirmations about {{user_goal}} using present-tense language',
                    category: 'all',
                },
                {
                    pattern: 'Meditate on {{user_focus}} and visualize the desired outcome',
                    category: 'all',
                },
                {
                    pattern: 'Light a {{category_color}} candle and set intention for {{user_goal}}',
                    category: 'love',
                    category_color: 'pink or rose',
                },
                {
                    pattern: 'Network with intention and authenticity around {{user_focus}}',
                    category: 'career',
                },
                {
                    pattern: 'Practice mindful movement or yoga to support {{user_goal}}',
                    category: 'health',
                },
                {
                    pattern: 'Visualize money flowing to you effortlessly for {{user_focus}}',
                    category: 'wealth',
                },
            ],
            what_to_manifest_templates: [
                {
                    pattern: 'Focus on the positive aspects of {{user_goal}}',
                    condition: 'energy_state === "aligned"',
                },
                {
                    pattern: 'Visualize the outcome of {{user_goal}} with clarity and emotion',
                    condition: 'energy_state === "aligned"',
                },
                {
                    pattern: 'Reframe your intention around {{user_focus}} in positive, present-tense language',
                    condition: 'energy_state === "blocked"',
                },
                {
                    pattern: 'Focus on what you want to experience with {{user_goal}}, not what you\'re trying to avoid',
                    condition: 'energy_state === "blocked"',
                },
                {
                    pattern: 'Clarify your intention around {{user_focus}} with more specific details',
                    condition: 'energy_state === "scattered" || energy_state === "doubtful"',
                },
                {
                    pattern: 'Focus on the feeling you want to experience when you achieve {{user_goal}}',
                    condition: 'energy_state === "scattered" || energy_state === "doubtful"',
                },
            ],
            what_not_to_manifest_templates: [
                {
                    pattern: 'Avoid focusing on what you lack or don\'t have regarding {{user_focus}}',
                    condition: 'energy_state === "blocked"',
                },
                {
                    pattern: 'Release fear-based thoughts and limiting beliefs around {{user_goal}}',
                    condition: 'energy_state === "blocked"',
                },
                {
                    pattern: 'Stop comparing yourself to others in the area of {{category_label}}',
                    condition: 'energy_state === "blocked"',
                },
                {
                    pattern: 'Replace "maybe" and "hopefully" with "I am" statements about {{user_goal}}',
                    condition: 'energy_state === "doubtful"',
                },
                {
                    pattern: 'Avoid negative self-talk regarding {{user_focus}}',
                    condition: 'all',
                },
                {
                    pattern: 'Don\'t force outcomes or become overly attached to {{user_goal}}',
                    condition: 'all',
                },
            ],
            thought_alignment_templates: [
                {
                    pattern: 'Practice daily affirmations aligned with {{user_goal}}',
                    condition: 'all',
                },
                {
                    pattern: 'Monitor and reframe limiting beliefs as they arise around {{user_focus}}',
                    condition: 'all',
                },
                {
                    pattern: 'Cultivate gratitude for what you already have in {{category_label}}',
                    condition: 'all',
                },
                {
                    pattern: 'Replace doubt words with confident statements about {{user_goal}}',
                    condition: 'energy_state === "doubtful"',
                },
                {
                    pattern: 'Release fear and doubt through daily affirmations for {{user_focus}}',
                    condition: 'energy_state === "blocked"',
                },
            ],
            insight_templates: [
                {
                    pattern: 'Your manifestation "{{manifestation_title}}" focuses on {{category_label}}. {{energy_state_reason}}. To strengthen manifestation in this area, consider {{core_shift}}.',
                    condition: 'all',
                },
                {
                    pattern: 'Your intention around {{user_goal}} reflects {{energy_state_reason}}. {{category_specific_guidance}}.',
                    condition: 'all',
                },
                {
                    pattern: '{{energy_state_analysis}} Your energy state is {{energy_state}}, which {{energy_impact}}. Focus on {{main_focus}}.',
                    condition: 'all',
                },
            ],
            summary_template: 'Your manifestation in the area of {{category_label}} is currently {{energy_state}}. Focus on {{main_focus}}.',
            scoring_rules: {
                resonance_base: 40,
                alignment_base: 40,
                antrashaakti_base: 40,
                mahaadha_base: 0,
                word_count_bonus_per_10_words: 1,
                positive_keyword_bonus: 6,
                negative_keyword_penalty: 5,
                clarity_bonus: 10,
                specificity_bonus: 10,
            },
            language_rules: {
                default: 'en',
                supported: ['en'],
            },
        };
    }
};
exports.ManifestationBackendConfigService = ManifestationBackendConfigService;
exports.ManifestationBackendConfigService = ManifestationBackendConfigService = ManifestationBackendConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => manifestation_db_config_service_1.ManifestationDbConfigService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        manifestation_db_config_service_1.ManifestationDbConfigService])
], ManifestationBackendConfigService);
//# sourceMappingURL=manifestation-backend-config.service.js.map