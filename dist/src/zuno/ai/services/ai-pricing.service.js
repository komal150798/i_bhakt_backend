"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AiPricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPricingService = void 0;
const common_1 = require("@nestjs/common");
const model_pricing_1 = require("../pricing/model-pricing");
let AiPricingService = AiPricingService_1 = class AiPricingService {
    constructor() {
        this.logger = new common_1.Logger(AiPricingService_1.name);
        this.table = model_pricing_1.DEFAULT_MODEL_PRICING;
        this.version = model_pricing_1.PRICING_VERSION;
        this.usingOverride = false;
        this.warnedKeys = new Set();
    }
    onModuleInit() {
        this.load();
    }
    load() {
        const override = (0, model_pricing_1.parsePricingOverride)(process.env.ZUNO_AI_PRICING_JSON);
        if (override) {
            this.table = override.prices;
            this.version = override.version;
            this.usingOverride = true;
            this.logger.log(`AI pricing loaded from ZUNO_AI_PRICING_JSON (version "${this.version}", ${Object.keys(this.table).length} models).`);
        }
        else {
            this.table = model_pricing_1.DEFAULT_MODEL_PRICING;
            this.version = model_pricing_1.PRICING_VERSION;
            this.usingOverride = false;
            if (process.env.ZUNO_AI_PRICING_JSON?.trim()) {
                this.logger.error('ZUNO_AI_PRICING_JSON is set but malformed; falling back to built-in seed prices. Cost figures may be wrong.');
            }
            else {
                this.logger.warn(`AI pricing is using built-in SEED list prices (version "${this.version}"). These are unverified - confirm against your provider invoice and set ZUNO_AI_PRICING_JSON before using cost figures for pricing decisions.`);
            }
        }
        this.warnedKeys.clear();
    }
    isUsingOverride() {
        return this.usingOverride;
    }
    getVersion() {
        return this.version;
    }
    findPrice(provider, model) {
        const p = (provider ?? '').trim().toLowerCase();
        const m = (model ?? '').trim().toLowerCase();
        if (!p || !m)
            return null;
        const exact = this.table[`${p}:${m}`];
        if (exact)
            return exact;
        let best = null;
        let bestLength = -1;
        for (const [key, price] of Object.entries(this.table)) {
            const separator = key.indexOf(':');
            if (separator < 0)
                continue;
            if (key.slice(0, separator) !== p)
                continue;
            const family = key.slice(separator + 1);
            if (m.startsWith(family) && family.length > bestLength) {
                best = price;
                bestLength = family.length;
            }
        }
        return best;
    }
    computeCost(provider, model, usage) {
        const price = this.findPrice(provider, model);
        if (!price) {
            const key = `${provider}:${model}`;
            if (!this.warnedKeys.has(key)) {
                this.warnedKeys.add(key);
                this.logger.warn(`No price configured for "${key}". Its runs are recorded UNPRICED and excluded from cost totals.`);
            }
            return { costMicroUsd: null, pricingVersion: model_pricing_1.UNPRICED_VERSION };
        }
        if (!usage) {
            return { costMicroUsd: null, pricingVersion: model_pricing_1.UNPRICED_VERSION };
        }
        const prompt = nonNegative(usage.prompt_tokens);
        const completion = nonNegative(usage.completion_tokens);
        if (prompt === null && completion === null) {
            const total = nonNegative(usage.total_tokens);
            if (total === null) {
                return { costMicroUsd: null, pricingVersion: model_pricing_1.UNPRICED_VERSION };
            }
            return {
                costMicroUsd: Math.round((total * price.outputMicrosPerMillion) / 1_000_000),
                pricingVersion: this.version,
            };
        }
        const micros = ((prompt ?? 0) * price.inputMicrosPerMillion +
            (completion ?? 0) * price.outputMicrosPerMillion) /
            1_000_000;
        return { costMicroUsd: Math.round(micros), pricingVersion: this.version };
    }
};
exports.AiPricingService = AiPricingService;
exports.AiPricingService = AiPricingService = AiPricingService_1 = __decorate([
    (0, common_1.Injectable)()
], AiPricingService);
function nonNegative(value) {
    if (typeof value !== 'number')
        return null;
    if (!Number.isFinite(value) || value < 0)
        return null;
    return value;
}
//# sourceMappingURL=ai-pricing.service.js.map