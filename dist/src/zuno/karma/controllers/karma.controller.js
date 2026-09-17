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
exports.ZunoKarmaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const karma_service_1 = require("../services/karma.service");
const karma_dtos_1 = require("../dtos/karma.dtos");
let ZunoKarmaController = class ZunoKarmaController {
    constructor(karma, idempotency) {
        this.karma = karma;
        this.idempotency = idempotency;
    }
    async create(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'KARMA_ENTRY_CREATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { entry, confirmationRequired, explanation } = await this.karma.createUserEntry({
                userId: user.id,
                text: dto.text,
                occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
                challengeId: dto.challengeId ?? null,
            });
            return {
                ...karma_dtos_1.KarmaEntryCreatedView.from(entry, confirmationRequired, explanation),
            };
        });
    }
    async list(user, query) {
        const { items, nextCursor } = await this.karma.list({
            userId: user.id,
            category: query.category,
            classification: query.classification,
            source: query.source,
            challengeId: query.challengeId,
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
            limit: query.limit ?? 20,
            cursor: query.cursor,
        });
        return new zuno_response_interceptor_1.ZunoPayload(items.map(karma_dtos_1.KarmaEntryView.from), {
            nextCursor,
            hasMore: nextCursor !== null,
        });
    }
    async summary(user) {
        return karma_dtos_1.KarmaSummaryView.from(await this.karma.summary(user.id));
    }
    async detail(user, entryId) {
        return karma_dtos_1.KarmaEntryDetailView.fromDetail(await this.karma.findOwned(user.id, entryId));
    }
    async correct(user, entryId, dto) {
        const entry = await this.karma.correct(user.id, entryId, {
            classification: dto.classification,
            category: dto.category,
            intent: dto.intent,
            text: dto.text,
            accepted: dto.classificationFeedback?.accepted,
            comment: dto.classificationFeedback?.comment,
            version: dto.version,
        });
        return karma_dtos_1.KarmaEntryDetailView.fromDetail(entry);
    }
    async remove(user, entryId) {
        await this.karma.remove(user.id, entryId);
    }
};
exports.ZunoKarmaController = ZunoKarmaController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Record something you did, in your own words' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Recorded.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Routed to safety instead of scored.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        karma_dtos_1.CreateKarmaEntryDto, String]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List your ledger, newest first' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        karma_dtos_1.ListKarmaQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Your recent ledger activity and observed patterns' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)(':entryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Read one ledger entry, with why it scored as it did' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('entryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':entryId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Correct how an entry was read' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('entryId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, karma_dtos_1.CorrectKarmaEntryDto]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "correct", null);
__decorate([
    (0, common_1.Delete)(':entryId'),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({ summary: 'Remove an entry from your ledger' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Removed.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('entryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoKarmaController.prototype, "remove", null);
exports.ZunoKarmaController = ZunoKarmaController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Karma Ledger'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('karma'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [karma_service_1.KarmaService,
        idempotency_service_1.IdempotencyService])
], ZunoKarmaController);
//# sourceMappingURL=karma.controller.js.map