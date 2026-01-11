"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstrologyModule = void 0;
const common_1 = require("@nestjs/common");
const swiss_ephemeris_service_1 = require("./services/swiss-ephemeris.service");
const ai_kundli_service_1 = require("./services/ai-kundli.service");
const ai_prompt_module_1 = require("../common/ai/ai-prompt.module");
let AstrologyModule = class AstrologyModule {
};
exports.AstrologyModule = AstrologyModule;
exports.AstrologyModule = AstrologyModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_prompt_module_1.AIPromptModule],
        providers: [swiss_ephemeris_service_1.SwissEphemerisService, ai_kundli_service_1.AIKundliService],
        exports: [swiss_ephemeris_service_1.SwissEphemerisService, ai_kundli_service_1.AIKundliService],
    })
], AstrologyModule);
//# sourceMappingURL=astrology.module.js.map