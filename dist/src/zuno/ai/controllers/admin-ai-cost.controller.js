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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAiCostController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const rulebook_actor_service_1 = require("../../rulebook/services/rulebook-actor.service");
const ai_cost_service_1 = require("../services/ai-cost.service");
const ai_pricing_service_1 = require("../services/ai-pricing.service");
const MAX_WINDOW_DAYS = 370;
const DEFAULT_WINDOW_DAYS = 30;
let AdminAiCostController = class AdminAiCostController {
    constructor(cost, pricing, actors) {
        this.cost = cost;
        this.pricing = pricing;
        this.actors = actors;
    }
    async whatNow(req, from, to) {
        await this.requireAdmin(req);
        const window = parseWindow(from, to);
        const report = await this.cost.whatNowCost(window);
        return new zuno_response_interceptor_1.ZunoPayload(report, {
            currency: 'USD',
            unit: 'micro_usd',
            warning: warningFor(report.confidence),
        });
    }
    async breakdown(req, by, from, to) {
        await this.requireAdmin(req);
        const window = parseWindow(from, to);
        const dimension = {
            operation: 'operation_type',
            model: 'model_name',
            provider: 'model_provider',
            status: 'status',
        }[(by ?? 'operation').toLowerCase()];
        if (!dimension) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
                message: '`by` must be one of: operation, model, provider, status.',
            });
        }
        const rows = await this.cost.breakdownBy(dimension, window);
        return new zuno_response_interceptor_1.ZunoPayload(rows, {
            currency: 'USD',
            unit: 'micro_usd',
            by: by ?? 'operation',
            window: { from: window.from.toISOString(), to: window.to.toISOString() },
        });
    }
    async daily(req, from, to) {
        await this.requireAdmin(req);
        const window = parseWindow(from, to);
        const rows = await this.cost.dailySeries(window);
        return new zuno_response_interceptor_1.ZunoPayload(rows, { currency: 'USD', unit: 'micro_usd' });
    }
    async challenge(req, id) {
        await this.requireAdmin(req);
        const report = await this.cost.costForChallenge(id);
        return new zuno_response_interceptor_1.ZunoPayload(report, { currency: 'USD', unit: 'micro_usd' });
    }
    async pricingStatus(req) {
        await this.requireAdmin(req);
        const usingOverride = this.pricing.isUsingOverride();
        return new zuno_response_interceptor_1.ZunoPayload({
            pricingVersion: this.pricing.getVersion(),
            source: usingOverride ? 'ZUNO_AI_PRICING_JSON' : 'built-in seed table',
            verifiedByOperator: usingOverride,
            warning: usingOverride
                ? null
                : 'Built-in prices are unverified seed values. Confirm against your provider invoice and set ZUNO_AI_PRICING_JSON before using these figures for pricing decisions.',
        });
    }
    async requireAdmin(req) {
        await this.actors.resolve(req.user);
    }
};
exports.AdminAiCostController = AdminAiCostController;
__decorate([
    (0, common_1.Get)('whatnow'),
    (0, swagger_1.ApiOperation)({ summary: 'Cost per WhatNow, with distribution' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'ISO 8601. Defaults to 30 days ago.' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'ISO 8601. Defaults to now.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminAiCostController.prototype, "whatNow", null);
__decorate([
    (0, common_1.Get)('breakdown'),
    (0, swagger_1.ApiOperation)({ summary: 'Spend grouped by operation, model, provider or status' }),
    (0, swagger_1.ApiQuery)({
        name: 'by',
        required: false,
        enum: ['operation', 'model', 'provider', 'status'],
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('by')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAiCostController.prototype, "breakdown", null);
__decorate([
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Daily spend and WhatNow volume' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminAiCostController.prototype, "daily", null);
__decorate([
    (0, common_1.Get)('challenge/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Total AI spend attributable to one challenge' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminAiCostController.prototype, "challenge", null);
__decorate([
    (0, common_1.Get)('pricing'),
    (0, swagger_1.ApiOperation)({ summary: 'Active price list version and its provenance' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAiCostController.prototype, "pricingStatus", null);
exports.AdminAiCostController = AdminAiCostController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Admin AI Cost'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('internal/ai-cost'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [ai_cost_service_1.AiCostService,
        ai_pricing_service_1.AiPricingService,
        rulebook_actor_service_1.RulebookActorService])
], AdminAiCostController);
function parseWindow(from, to) {
    const now = new Date();
    const parsedTo = from || to ? parseDate(to, now) : now;
    const defaultFrom = new Date(parsedTo.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
    const parsedFrom = parseDate(from, defaultFrom);
    if (parsedFrom >= parsedTo) {
        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
            message: '`from` must be earlier than `to`.',
        });
    }
    const spanDays = (parsedTo.getTime() - parsedFrom.getTime()) / 86_400_000;
    if (spanDays > MAX_WINDOW_DAYS) {
        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
            message: `Window may not exceed ${MAX_WINDOW_DAYS} days.`,
        });
    }
    return { from: parsedFrom, to: parsedTo };
}
function parseDate(value, fallback) {
    if (!value)
        return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
            message: `"${value}" is not a valid ISO 8601 date.`,
        });
    }
    return parsed;
}
function warningFor(confidence) {
    const parts = [];
    if (confidence.unpricedRuns > 0) {
        parts.push(`${confidence.unpricedRuns} model call(s) had no configured price and contributed 0 - these totals are a lower bound.`);
    }
    if (!confidence.pricesVerifiedByOperator) {
        parts.push('Prices are unverified built-in seed values; confirm against your provider invoice.');
    }
    return parts.length ? parts.join(' ') : null;
}
//# sourceMappingURL=admin-ai-cost.controller.js.map