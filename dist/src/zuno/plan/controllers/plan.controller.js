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
exports.ZunoChallengePlansController = exports.ZunoPlanItemsController = exports.ZunoPlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const plan_service_1 = require("../services/plan.service");
const plan_dtos_1 = require("../dtos/plan.dtos");
let ZunoPlansController = class ZunoPlansController {
    constructor(plans, idempotency) {
        this.plans = plans;
        this.idempotency = idempotency;
    }
    async list(user, query) {
        const rows = query.challengeId
            ? await this.plans.listForChallenge(user, query.challengeId)
            : await this.plans.list(user.id);
        return rows.map(plan_dtos_1.PlanView.summary);
    }
    async generate(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'PLAN_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { plan, items } = await this.plans.generate({
                user,
                challengeId: dto.challengeId,
                planType: dto.planType,
                regenerate: dto.regenerate === true,
            });
            return { ...plan_dtos_1.PlanView.from(plan, items) };
        });
    }
    async detail(user, planId) {
        const { plan, items } = await this.plans.detail(user, planId);
        return plan_dtos_1.PlanView.from(plan, items);
    }
    async patch(user, planId, dto) {
        const plan = await this.plans.patch(user, planId, dto);
        return plan_dtos_1.PlanView.summary(plan);
    }
    async activate(user, planId, dto) {
        const plan = await this.plans.activate(user, planId, dto.version);
        return plan_dtos_1.PlanView.summary(plan);
    }
    async addItem(user, planId, dto) {
        const item = await this.plans.addItem(user, planId, {
            title: dto.title,
            description: dto.description,
            category: dto.category,
            priority: dto.priority,
            estimatedMinutes: dto.estimatedMinutes,
            scheduledDate: dto.scheduledDate,
            isCommitment: dto.isCommitment === true,
        });
        return plan_dtos_1.PlanItemView.from(item);
    }
};
exports.ZunoPlansController = ZunoPlansController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List the user's plans, optionally for one WhatNow" }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        plan_dtos_1.ListPlansQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Build a plan for a WhatNow over one horizon' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan generated or returned.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        plan_dtos_1.GeneratePlanDto, String]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(':planId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one plan with its items' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':planId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a plan title, goal or status' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version, or illegal transition.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.PatchPlanDto]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)(':planId/activate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a draft plan' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Over capacity, or illegal transition.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.ActivatePlanDto]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':planId/items'),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Add a task of your own to this plan' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'The plan is already at capacity.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.AddPlanItemDto]),
    __metadata("design:returntype", Promise)
], ZunoPlansController.prototype, "addItem", null);
exports.ZunoPlansController = ZunoPlansController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Plans'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [plan_service_1.PlanService,
        idempotency_service_1.IdempotencyService])
], ZunoPlansController);
let ZunoPlanItemsController = class ZunoPlanItemsController {
    constructor(plans) {
        this.plans = plans;
    }
    async detail(user, itemId) {
        const item = await this.plans.findOwnedItem(user.id, itemId);
        return plan_dtos_1.PlanItemView.from(item);
    }
    async start(user, itemId) {
        const item = await this.plans.startItem(user, itemId);
        return plan_dtos_1.PlanItemView.from(item);
    }
    async complete(user, itemId, dto) {
        const item = await this.plans.completeItem(user, itemId, { note: dto.note });
        return plan_dtos_1.PlanItemView.from(item);
    }
    async defer(user, itemId, dto) {
        const item = await this.plans.deferItem(user, itemId, {
            to: dto.to,
            reason: dto.reason,
        });
        return plan_dtos_1.PlanItemView.from(item);
    }
    async skip(user, itemId, dto) {
        const item = await this.plans.skipItem(user, itemId, { reason: dto.reason });
        return plan_dtos_1.PlanItemView.from(item);
    }
    async block(user, itemId, dto) {
        const item = await this.plans.blockItem(user, itemId, dto.reason);
        return plan_dtos_1.PlanItemView.from(item);
    }
    async history(user, itemId) {
        const rows = await this.plans.historyFor(user, itemId);
        return rows.map((row) => ({
            id: row.id,
            eventType: row.event_type,
            oldStatus: row.old_status,
            newStatus: row.new_status,
            reason: row.reason,
            source: row.source,
            createdAt: row.created_at.toISOString(),
        }));
    }
};
exports.ZunoPlanItemsController = ZunoPlanItemsController;
__decorate([
    (0, common_1.Get)(':itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one plan item' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':itemId/start'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a plan item as started' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Illegal transition, or a dependency is unfinished.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':itemId/complete'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a plan item done' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Illegal transition, or a dependency is unfinished.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.CompletePlanItemDto]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':itemId/defer'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Move a plan item to a later date' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.DeferPlanItemDto]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "defer", null);
__decorate([
    (0, common_1.Post)(':itemId/skip'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Skip a plan item, without penalty' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.SkipPlanItemDto]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "skip", null);
__decorate([
    (0, common_1.Post)(':itemId/block'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Record that something is blocking this item' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, plan_dtos_1.BlockPlanItemDto]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "block", null);
__decorate([
    (0, common_1.Get)(':itemId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Status history for one plan item' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoPlanItemsController.prototype, "history", null);
exports.ZunoPlanItemsController = ZunoPlanItemsController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Plan items'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('plan-items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [plan_service_1.PlanService])
], ZunoPlanItemsController);
let ZunoChallengePlansController = class ZunoChallengePlansController {
    constructor(plans, idempotency) {
        this.plans = plans;
        this.idempotency = idempotency;
    }
    async list(user, challengeId) {
        const rows = await this.plans.listForChallenge(user, challengeId);
        return rows.map(plan_dtos_1.PlanView.summary);
    }
    async generate(user, challengeId, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'PLAN_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: { challengeId, ...dto },
        }, async () => {
            const { plan, items } = await this.plans.generate({
                user,
                challengeId,
                planType: dto?.planType,
                regenerate: dto?.regenerate === true,
            });
            return { ...plan_dtos_1.PlanView.from(plan, items) };
        });
    }
};
exports.ZunoChallengePlansController = ZunoChallengePlansController;
__decorate([
    (0, common_1.Get)(':challengeId/plans'),
    (0, swagger_1.ApiOperation)({ summary: 'List the plans for this WhatNow' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengePlansController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':challengeId/plans/generate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Build a plan for this WhatNow' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, Object, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengePlansController.prototype, "generate", null);
exports.ZunoChallengePlansController = ZunoChallengePlansController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Plans'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('challenges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [plan_service_1.PlanService,
        idempotency_service_1.IdempotencyService])
], ZunoChallengePlansController);
//# sourceMappingURL=plan.controller.js.map