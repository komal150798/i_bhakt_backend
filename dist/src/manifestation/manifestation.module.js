"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const manifestation_log_entity_1 = require("./entities/manifestation-log.entity");
const manifestation_entity_1 = require("./entities/manifestation.entity");
const entities_1 = require("./entities");
const manifestation_service_1 = require("./manifestation.service");
const manifestation_enhanced_service_1 = require("./services/manifestation-enhanced.service");
const manifestation_ai_evaluation_service_1 = require("./services/manifestation-ai-evaluation.service");
const app_manifestation_controller_1 = require("./controllers/app-manifestation.controller");
const cache_module_1 = require("../cache/cache.module");
const astrology_module_1 = require("../astrology/astrology.module");
const customer_entity_1 = require("../users/entities/customer.entity");
const axios_1 = require("@nestjs/axios");
const manifestation_llm_analyzer_service_1 = require("./services/manifestation-llm-analyzer.service");
const manifestation_backend_config_service_1 = require("./services/manifestation-backend-config.service");
const manifestation_db_config_service_1 = require("./services/manifestation-db-config.service");
const manifestation_alignment_service_1 = require("./services/manifestation-alignment.service");
const constants_module_1 = require("../common/constants/constants.module");
const ai_prompt_module_1 = require("../common/ai/ai-prompt.module");
const dasha_record_entity_1 = require("../database/entities/dasha-record.entity");
const antardasha_record_entity_1 = require("../database/entities/antardasha-record.entity");
const pratyantar_dasha_record_entity_1 = require("../database/entities/pratyantar-dasha-record.entity");
const sukshma_dasha_record_entity_1 = require("../database/entities/sukshma-dasha-record.entity");
const kundli_module_1 = require("../kundli/kundli.module");
const kundli_entity_1 = require("../kundli/entities/kundli.entity");
const kundli_planet_entity_1 = require("../kundli/entities/kundli-planet.entity");
const kundli_house_entity_1 = require("../kundli/entities/kundli-house.entity");
const seed_manifestation_master_data_service_1 = require("./seeds/seed-manifestation-master-data.service");
let ManifestationModule = class ManifestationModule {
};
exports.ManifestationModule = ManifestationModule;
exports.ManifestationModule = ManifestationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                manifestation_log_entity_1.ManifestationLog,
                manifestation_entity_1.Manifestation,
                customer_entity_1.Customer,
                dasha_record_entity_1.DashaRecord,
                antardasha_record_entity_1.AntardashaRecord,
                pratyantar_dasha_record_entity_1.PratyantarDashaRecord,
                sukshma_dasha_record_entity_1.SukshmaDashaRecord,
                kundli_entity_1.Kundli,
                kundli_planet_entity_1.KundliPlanet,
                kundli_house_entity_1.KundliHouse,
                entities_1.ManifestCategory,
                entities_1.ManifestSubcategory,
                entities_1.ManifestKeyword,
                entities_1.ManifestEnergyRule,
                entities_1.ManifestRitualTemplate,
                entities_1.ManifestToManifestTemplate,
                entities_1.ManifestNotToManifestTemplate,
                entities_1.ManifestAlignmentTemplate,
                entities_1.ManifestInsightTemplate,
                entities_1.ManifestSummaryTemplate,
                entities_1.ManifestBackendCache,
                entities_1.ManifestUserLog,
            ]),
            axios_1.HttpModule,
            cache_module_1.CacheModule,
            astrology_module_1.AstrologyModule,
            kundli_module_1.KundliModule,
            constants_module_1.ConstantsModule,
            ai_prompt_module_1.AIPromptModule,
        ],
        controllers: [app_manifestation_controller_1.AppManifestationController],
        providers: [
            manifestation_service_1.ManifestationService,
            manifestation_enhanced_service_1.ManifestationEnhancedService,
            manifestation_ai_evaluation_service_1.ManifestationAIEvaluationService,
            manifestation_llm_analyzer_service_1.ManifestationLLMAnalyzerService,
            manifestation_backend_config_service_1.ManifestationBackendConfigService,
            manifestation_db_config_service_1.ManifestationDbConfigService,
            manifestation_alignment_service_1.ManifestationAlignmentService,
            seed_manifestation_master_data_service_1.SeedManifestationMasterDataService,
        ],
        exports: [manifestation_service_1.ManifestationService, manifestation_enhanced_service_1.ManifestationEnhancedService, manifestation_db_config_service_1.ManifestationDbConfigService],
    })
], ManifestationModule);
//# sourceMappingURL=manifestation.module.js.map