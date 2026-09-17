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
exports.ZunoRealignmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const realignment_service_1 = require("../services/realignment.service");
const realignment_dtos_1 = require("../dtos/realignment.dtos");
let ZunoRealignmentController = class ZunoRealignmentController {
    constructor(realignment, idempotency) {
        this.realignment = realignment;
        this.idempotency = idempotency;
    }
    async evaluate(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'REALIGNMENT_EVALUATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const decision = await this.realignment.evaluate({
                user,
                challengeId: dto.challengeId,
                triggerSignalId: dto.triggerSignalId ?? null,
            });
            return {
                ...realignment_dtos_1.RealignmentView.from(decision.realignment, decision.changes),
                replayed: decision.idempotentReplay,
            };
        });
    }
    async apply(user, realignmentId, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'REALIGNMENT_APPLY',
            key: idempotencyKey,
            userId: user.id,
            requestBody: { realignmentId, ...dto },
        }, async () => {
            const applied = await this.realignment.apply({
                user,
                realignmentId,
                userConfirmed: dto.confirmed,
                expectedVersion: dto.version,
            });
            const changes = await this.realignment.changesFor(applied.realignment.id);
            return {
                ...realignment_dtos_1.RealignmentView.from(applied.realignment, changes),
                newPlanId: applied.newPlanId,
                cancelledItemCount: applied.cancelledItemIds.length,
                suppressedReminderCount: applied.suppressedReminderIds.length,
                planChangesApplied: applied.targetApplied,
            };
        });
    }
    async list(user, query) {
        const rows = await this.realignment.list(user.id, query.challengeId, query.limit ?? 20);
        return rows.map((row) => realignment_dtos_1.RealignmentView.from(row));
    }
    async detail(user, realignmentId) {
        const row = await this.realignment.findOwned(user.id, realignmentId);
        const changes = await this.realignment.changesFor(row.id);
        return realignment_dtos_1.RealignmentView.from(row, changes);
    }
};
exports.ZunoRealignmentController = ZunoRealignmentController;
__decorate([
    (0, common_1.Post)('evaluate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Work out what should change, without changing it' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'A realignment decision, possibly NONE.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        realignment_dtos_1.EvaluateRealignmentDto, String]),
    __metadata("design:returntype", Promise)
], ZunoRealignmentController.prototype, "evaluate", null);
__decorate([
    (0, common_1.Post)(':realignmentId/apply'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Apply this realignment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Applied.' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Needs your confirmation, already applied, or nothing to change.',
    }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('realignmentId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, realignment_dtos_1.ApplyRealignmentDto, String]),
    __metadata("design:returntype", Promise)
], ZunoRealignmentController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Realignments for a WhatNow, newest first' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        realignment_dtos_1.ListRealignmentsQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoRealignmentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':realignmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'One realignment, with its full diff' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('realignmentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoRealignmentController.prototype, "detail", null);
exports.ZunoRealignmentController = ZunoRealignmentController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Realignment'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('realignment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [realignment_service_1.RealignmentService,
        idempotency_service_1.IdempotencyService])
], ZunoRealignmentController);
//# sourceMappingURL=realignment.controller.js.map