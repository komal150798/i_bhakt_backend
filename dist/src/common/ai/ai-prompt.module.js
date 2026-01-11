"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPromptModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const ai_prompt_entity_1 = require("./entities/ai-prompt.entity");
const prompt_service_1 = require("./prompt.service");
const llm_service_1 = require("./services/llm.service");
const cache_module_1 = require("../../cache/cache.module");
const admin_ai_prompt_controller_1 = require("./controllers/admin-ai-prompt.controller");
let AIPromptModule = class AIPromptModule {
};
exports.AIPromptModule = AIPromptModule;
exports.AIPromptModule = AIPromptModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ai_prompt_entity_1.AIPrompt]),
            axios_1.HttpModule,
            cache_module_1.CacheModule,
        ],
        controllers: [admin_ai_prompt_controller_1.AdminAIPromptController],
        providers: [prompt_service_1.PromptService, llm_service_1.LLMService],
        exports: [prompt_service_1.PromptService, llm_service_1.LLMService, typeorm_1.TypeOrmModule],
    })
], AIPromptModule);
//# sourceMappingURL=ai-prompt.module.js.map