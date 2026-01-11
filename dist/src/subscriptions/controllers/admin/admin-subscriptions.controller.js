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
exports.AdminSubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const subscriptions_service_1 = require("../../services/subscriptions.service");
const plans_service_1 = require("../../../plans/services/plans.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../../entities/subscription.entity");
const plan_entity_1 = require("../../../plans/entities/plan.entity");
let AdminSubscriptionsController = class AdminSubscriptionsController {
    constructor(subscriptionsService, plansService, subscriptionRepository, planRepository) {
        this.subscriptionsService = subscriptionsService;
        this.plansService = plansService;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
    }
    async findAll(body) {
        const page = body.page || 1;
        const limit = body.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.subscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .where('subscription.is_deleted = :isDeleted', { isDeleted: false });
        if (body.plan_type) {
            queryBuilder.andWhere('subscription.plan_type = :planType', {
                planType: body.plan_type,
            });
        }
        if (body.is_active !== undefined) {
            queryBuilder.andWhere('subscription.is_active = :isActive', {
                isActive: body.is_active,
            });
        }
        if (body.user_id) {
            queryBuilder.andWhere('subscription.user_id = :userId', {
                userId: body.user_id,
            });
        }
        if (body.search) {
            queryBuilder.andWhere('(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search OR plan.name ILIKE :search)', { search: `%${body.search}%` });
        }
        const total = await queryBuilder.getCount();
        const subscriptions = await queryBuilder
            .orderBy('subscription.added_date', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();
        return {
            success: true,
            data: subscriptions.map((sub) => ({
                id: sub.id,
                unique_id: sub.unique_id,
                user_id: sub.user_id,
                user_email: sub.user?.email || null,
                user_name: sub.user
                    ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() || sub.user.email
                    : null,
                plan_id: sub.plan_id,
                plan_name: sub.plan?.name || null,
                plan_type: sub.plan_type,
                start_date: sub.start_date,
                end_date: sub.end_date,
                is_active: sub.is_active,
                is_renewal: sub.is_renewal,
                cancelled_at: sub.cancelled_at,
                cancellation_reason: sub.cancellation_reason,
                added_date: sub.added_date,
                modify_date: sub.modify_date,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['user', 'plan', 'order'],
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        return {
            success: true,
            data: {
                id: subscription.id,
                unique_id: subscription.unique_id,
                user_id: subscription.user_id,
                user: subscription.user
                    ? {
                        id: subscription.user.id,
                        email: subscription.user.email,
                        first_name: subscription.user.first_name,
                        last_name: subscription.user.last_name,
                    }
                    : null,
                plan_id: subscription.plan_id,
                plan: subscription.plan
                    ? {
                        id: subscription.plan.id,
                        name: subscription.plan.name,
                        plan_type: subscription.plan.plan_type,
                    }
                    : null,
                plan_type: subscription.plan_type,
                start_date: subscription.start_date,
                end_date: subscription.end_date,
                is_active: subscription.is_active,
                is_renewal: subscription.is_renewal,
                order_id: subscription.order_id,
                cancelled_at: subscription.cancelled_at,
                cancellation_reason: subscription.cancellation_reason,
                added_date: subscription.added_date,
                modify_date: subscription.modify_date,
            },
        };
    }
    async create(body) {
        const subscription = await this.subscriptionsService.createSubscription(body.user_id, body.plan_id, body.start_date ? new Date(body.start_date) : undefined, body.order_id);
        if (body.end_date) {
            subscription.end_date = new Date(body.end_date);
            await this.subscriptionsService['subscriptionRepository'].save(subscription);
        }
        return {
            success: true,
            data: {
                id: subscription.id,
                user_id: subscription.user_id,
                plan_id: subscription.plan_id,
                plan_type: subscription.plan_type,
                start_date: subscription.start_date,
                end_date: subscription.end_date,
                is_active: subscription.is_active,
            },
        };
    }
    async update(id, body) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['plan'],
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (body.plan_id && body.plan_id !== subscription.plan_id) {
            const newPlan = await this.planRepository.findOne({
                where: { id: body.plan_id, is_deleted: false },
            });
            if (!newPlan) {
                throw new Error('Plan not found');
            }
            subscription.plan_id = body.plan_id;
            subscription.plan_type = newPlan.plan_type;
        }
        if (body.start_date) {
            subscription.start_date = new Date(body.start_date);
        }
        if (body.end_date !== undefined) {
            subscription.end_date = body.end_date ? new Date(body.end_date) : null;
        }
        if (body.is_active !== undefined) {
            subscription.is_active = body.is_active;
            if (!body.is_active && !subscription.cancelled_at) {
                subscription.cancelled_at = new Date();
            }
            else if (body.is_active && subscription.cancelled_at) {
                subscription.cancelled_at = null;
                subscription.cancellation_reason = null;
            }
        }
        if (body.cancellation_reason !== undefined) {
            subscription.cancellation_reason = body.cancellation_reason;
        }
        const updated = await this.subscriptionRepository.save(subscription);
        return {
            success: true,
            data: {
                id: updated.id,
                user_id: updated.user_id,
                plan_id: updated.plan_id,
                plan_type: updated.plan_type,
                start_date: updated.start_date,
                end_date: updated.end_date,
                is_active: updated.is_active,
                cancelled_at: updated.cancelled_at,
            },
        };
    }
    async cancel(id, body) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        await this.subscriptionsService.cancelSubscription(subscription.user_id, body.reason);
        return {
            success: true,
            message: 'Subscription cancelled successfully',
        };
    }
    async getAvailablePlans() {
        const plans = await this.plansService.findAll({ is_enabled: true });
        return {
            success: true,
            data: plans,
        };
    }
};
exports.AdminSubscriptionsController = AdminSubscriptionsController;
__decorate([
    (0, common_1.Post)('list'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscriptions (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription by ID (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create subscription (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subscription created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update subscription (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription updated successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel subscription (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('plans/available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available plans (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plans retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "getAvailablePlans", null);
exports.AdminSubscriptionsController = AdminSubscriptionsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Subscriptions'),
    (0, common_1.Controller)('admin/subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(2, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(3, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        plans_service_1.PlansService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminSubscriptionsController);
//# sourceMappingURL=admin-subscriptions.controller.js.map