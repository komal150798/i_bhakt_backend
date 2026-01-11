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
var AIKundliService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIKundliService = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../../common/ai/services/llm.service");
let AIKundliService = AIKundliService_1 = class AIKundliService {
    constructor(llmService) {
        this.llmService = llmService;
        this.logger = new common_1.Logger(AIKundliService_1.name);
    }
    async calculateKundli(params) {
        const { birthDate, birthTime, birthPlace, latitude, longitude, timezone } = params;
        this.logger.log(`🔮 Calculating Kundli via AI for ${birthPlace} on ${birthDate} at ${birthTime}`);
        const systemPrompt = `Vedic astrologer. Return JSON only.`;
        const userPrompt = `Kundli for ${birthDate} ${birthTime} at ${birthPlace} (${latitude},${longitude} ${timezone}). Lahiri Ayanamsa, Whole Sign houses.

JSON format:
{"lagna":{"sign":"X","degrees":N,"signLord":"X"},"nakshatra":{"name":"X","lord":"X","pada":N},"planets":[{"name":"Sun","sign":"X","signLord":"X","degrees":N,"nakshatra":"X","nakshatraLord":"X","nakshatraPada":N,"house":N,"isRetrograde":false},{"name":"Moon",...},{"name":"Mars",...},{"name":"Mercury",...},{"name":"Jupiter",...},{"name":"Venus",...},{"name":"Saturn",...},{"name":"Rahu","isRetrograde":true,...},{"name":"Ketu","isRetrograde":true,...}],"tithi":"X","yoga":"X","karana":"X","ayanamsa":N}

Return complete JSON with all 9 planets calculated for the given birth data.`;
        try {
            const response = await this.llmService.callLLMJSON({
                systemPrompt,
                userPrompt,
                temperature: 0.1,
                maxTokens: 8192,
                responseFormat: 'json_object',
                timeout: 60000,
                maxRetries: 2,
            });
            this.logger.log(`✅ AI Kundli calculation successful`);
            const data = response.data;
            if (!data.lagna || !data.nakshatra || !data.planets) {
                throw new Error('Invalid AI response structure - missing lagna, nakshatra, or planets');
            }
            if (data.planets.length < 9) {
                this.logger.warn(`⚠️ AI returned only ${data.planets.length} planets, expected 9`);
                if (data.planets.length < 5) {
                    throw new Error(`Invalid AI response - only ${data.planets.length} planets returned`);
                }
            }
            return data;
        }
        catch (error) {
            this.logger.error(`❌ AI Kundli calculation failed: ${error}`);
            throw error;
        }
    }
};
exports.AIKundliService = AIKundliService;
exports.AIKundliService = AIKundliService = AIKundliService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LLMService])
], AIKundliService);
//# sourceMappingURL=ai-kundli.service.js.map