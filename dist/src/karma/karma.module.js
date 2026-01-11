"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const karma_entry_entity_1 = require("./entities/karma-entry.entity");
const karma_master_good_entity_1 = require("./entities/karma-master-good.entity");
const karma_master_bad_entity_1 = require("./entities/karma-master-bad.entity");
const karma_category_entity_1 = require("./entities/karma-category.entity");
const karma_weight_rule_entity_1 = require("./entities/karma-weight-rule.entity");
const karma_habit_suggestion_entity_1 = require("./entities/karma-habit-suggestion.entity");
const karma_pattern_entity_1 = require("./entities/karma-pattern.entity");
const karma_score_summary_entity_1 = require("./entities/karma-score-summary.entity");
const customer_entity_1 = require("../users/entities/customer.entity");
const ai_classification_service_1 = require("./services/ai-classification.service");
const karma_score_service_1 = require("./services/karma-score.service");
const pattern_analysis_service_1 = require("./services/pattern-analysis.service");
const habit_recommendation_service_1 = require("./services/habit-recommendation.service");
const karma_service_1 = require("./services/karma.service");
const karma_streak_service_1 = require("./services/karma-streak.service");
const seed_karma_master_data_service_1 = require("./seeds/seed-karma-master-data.service");
const repositories_module_1 = require("../infrastructure/repositories/repositories.module");
const app_karma_controller_1 = require("./controllers/app-karma.controller");
const ai_prompt_module_1 = require("../common/ai/ai-prompt.module");
const constants_module_1 = require("../common/constants/constants.module");
const axios_1 = require("@nestjs/axios");
let KarmaModule = class KarmaModule {
};
exports.KarmaModule = KarmaModule;
exports.KarmaModule = KarmaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                karma_entry_entity_1.KarmaEntry,
                karma_master_good_entity_1.KarmaMasterGood,
                karma_master_bad_entity_1.KarmaMasterBad,
                karma_category_entity_1.KarmaCategory,
                karma_weight_rule_entity_1.KarmaWeightRule,
                karma_habit_suggestion_entity_1.KarmaHabitSuggestion,
                karma_pattern_entity_1.KarmaPattern,
                karma_score_summary_entity_1.KarmaScoreSummary,
                customer_entity_1.Customer,
            ]),
            repositories_module_1.RepositoriesModule,
            ai_prompt_module_1.AIPromptModule,
            constants_module_1.ConstantsModule,
            axios_1.HttpModule,
        ],
        controllers: [app_karma_controller_1.AppKarmaController],
        providers: [
            ai_classification_service_1.AIClassificationService,
            karma_score_service_1.KarmaScoreService,
            pattern_analysis_service_1.PatternAnalysisService,
            habit_recommendation_service_1.HabitRecommendationService,
            karma_service_1.KarmaService,
            karma_streak_service_1.KarmaStreakService,
            seed_karma_master_data_service_1.SeedKarmaMasterDataService,
        ],
        exports: [
            ai_classification_service_1.AIClassificationService,
            karma_score_service_1.KarmaScoreService,
            pattern_analysis_service_1.PatternAnalysisService,
            habit_recommendation_service_1.HabitRecommendationService,
            karma_service_1.KarmaService,
            karma_streak_service_1.KarmaStreakService,
        ],
    })
], KarmaModule);
//# sourceMappingURL=karma.module.js.map