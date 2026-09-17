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
exports.ZunoFutureSelfController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const future_self_service_1 = require("../services/future-self.service");
const future_self_dtos_1 = require("../dtos/future-self.dtos");
let ZunoFutureSelfController = class ZunoFutureSelfController {
    constructor(futureSelf, idempotency) {
        this.futureSelf = futureSelf;
        this.idempotency = idempotency;
    }
    async generate(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'FUTURE_SELF_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { narrative, sources } = await this.futureSelf.generate({
                userId: user.id,
                challengeId: dto.challengeId ?? null,
                mode: dto.mode,
            });
            return { ...future_self_dtos_1.FutureSelfView.from(narrative, sources.length) };
        });
    }
    async list(user, query) {
        const rows = await this.futureSelf.listForUser(user.id, {
            challengeId: query.challengeId,
            mode: query.mode,
            limit: query.limit,
        });
        return rows.map((row) => future_self_dtos_1.FutureSelfView.from(row, 0));
    }
    async detail(user, futureSelfId) {
        const narrative = await this.futureSelf.findOwned(user.id, futureSelfId);
        await this.futureSelf.markViewed(user.id, narrative.id);
        return future_self_dtos_1.FutureSelfView.from(narrative, narrative.sources?.length ?? 0);
    }
};
exports.ZunoFutureSelfController = ZunoFutureSelfController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a grounded Future Self reflection' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Narrative generated and grounded.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'Could not produce a narrative we were confident was grounded, or the intelligence layer is unavailable.',
    }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        future_self_dtos_1.GenerateFutureSelfDto, String]),
    __metadata("design:returntype", Promise)
], ZunoFutureSelfController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Past Future Self reflections' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        future_self_dtos_1.ListFutureSelfQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoFutureSelfController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':futureSelfId'),
    (0, swagger_1.ApiOperation)({ summary: 'One Future Self reflection' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('futureSelfId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoFutureSelfController.prototype, "detail", null);
exports.ZunoFutureSelfController = ZunoFutureSelfController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Future Self'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('future-self'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [future_self_service_1.FutureSelfService,
        idempotency_service_1.IdempotencyService])
], ZunoFutureSelfController);
//# sourceMappingURL=future-self.controller.js.map