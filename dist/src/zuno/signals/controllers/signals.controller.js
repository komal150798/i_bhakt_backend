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
exports.ZunoSignalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const life_signal_service_1 = require("../services/life-signal.service");
const signal_trend_service_1 = require("../services/signal-trend.service");
const signal_dtos_1 = require("../dtos/signal.dtos");
let ZunoSignalsController = class ZunoSignalsController {
    constructor(signals, trends, idempotency) {
        this.signals = signals;
        this.trends = trends;
        this.idempotency = idempotency;
    }
    async create(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'LIFE_SIGNAL_CREATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const result = await this.signals.record({
                user,
                challengeId: dto.challengeId ?? null,
                signalType: dto.signalType,
                source: dto.source,
                statement: dto.value.statement,
                occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
            });
            return {
                signalId: result.signal?.id ?? null,
                confirmationStatus: result.signal?.confirmation_status ?? null,
                realignmentRecommended: result.realignmentRecommended,
                clarificationRequired: result.clarificationRequired,
                acknowledgedOnly: result.ignoredAsNoise,
                duplicateOfExisting: result.deduplicated,
                interpretationUnavailable: result.interpretationUnavailable,
                signal: result.signal ? signal_dtos_1.LifeSignalView.from(result.signal) : null,
            };
        });
    }
    async list(user, query) {
        const separated = await this.signals.listSeparated({
            userId: user.id,
            challengeId: query.challengeId ?? null,
            status: query.status,
            limit: query.limit ?? 20,
        });
        return new zuno_response_interceptor_1.ZunoPayload({
            confirmed: separated.confirmed.map(signal_dtos_1.LifeSignalView.from),
            unconfirmed: separated.unconfirmed.map(signal_dtos_1.LifeSignalView.from),
        }, {
            confirmedCount: separated.confirmed.length,
            unconfirmedCount: separated.unconfirmed.length,
        });
    }
    async categoryTrends(user, query) {
        return this.trends.categoryTrends(user.id, query.challengeId ?? null);
    }
    async detail(user, signalId) {
        const signal = await this.signals.findOwned(user.id, signalId);
        return signal_dtos_1.LifeSignalView.from(signal);
    }
    async confirm(user, signalId, dto) {
        const signal = await this.signals.confirm(user, signalId, dto.note);
        return signal_dtos_1.LifeSignalView.from(signal);
    }
    async reject(user, signalId, dto) {
        const signal = await this.signals.reject(user, signalId, dto.note);
        return signal_dtos_1.LifeSignalView.from(signal);
    }
};
exports.ZunoSignalsController = ZunoSignalsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Tell ZUNO what changed' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Recorded, or acknowledged as no change.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        signal_dtos_1.CreateLifeSignalDto, String]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List what has changed, confirmed separately from inferred' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        signal_dtos_1.ListLifeSignalsQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Category trends for My Journey' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        signal_dtos_1.TrendsQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "categoryTrends", null);
__decorate([
    (0, common_1.Get)(':signalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one signal' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('signalId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':signalId/confirm'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm that this really happened' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already rejected.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('signalId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, signal_dtos_1.ConfirmLifeSignalDto]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':signalId/reject'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Tell ZUNO this is not right' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('signalId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, signal_dtos_1.ConfirmLifeSignalDto]),
    __metadata("design:returntype", Promise)
], ZunoSignalsController.prototype, "reject", null);
exports.ZunoSignalsController = ZunoSignalsController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Life Signals'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('signals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [life_signal_service_1.LifeSignalService,
        signal_trend_service_1.SignalTrendService,
        idempotency_service_1.IdempotencyService])
], ZunoSignalsController);
//# sourceMappingURL=signals.controller.js.map