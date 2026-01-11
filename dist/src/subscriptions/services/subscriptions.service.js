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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../entities/subscription.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
let SubscriptionsService = class SubscriptionsService {
    constructor(subscriptionRepository, userRepository, planRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
    }
    async getCurrentSubscription(userId) {
        return this.subscriptionRepository.findOne({
            where: {
                user_id: userId,
                is_active: true,
                is_deleted: false,
                end_date: (0, typeorm_2.MoreThan)(new Date()),
            },
            relations: ['plan', 'plan.modules'],
            order: { start_date: 'DESC' },
        });
    }
    async getCurrentPlanType(userId) {
        const subscription = await this.getCurrentSubscription(userId);
        return subscription?.plan_type || plan_type_enum_1.PlanType.FREE;
    }
    async hasModuleAccess(userId, moduleSlug) {
        const subscription = await this.getCurrentSubscription(userId);
        if (!subscription) {
            return false;
        }
        const plan = subscription.plan;
        if (!plan.modules || plan.modules.length === 0) {
            return false;
        }
        return plan.modules.some((module) => module.slug === moduleSlug);
    }
    async getUserModules(userId) {
        const subscription = await this.getCurrentSubscription(userId);
        if (!subscription) {
            return [];
        }
        const plan = subscription.plan;
        return plan.modules?.map((m) => m.slug) || [];
    }
    async createSubscription(userId, planId, startDate, orderId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const plan = await this.planRepository.findOne({ where: { id: planId, is_deleted: false } });
        if (!plan) {
            throw new common_1.NotFoundException('Plan not found');
        }
        await this.subscriptionRepository.update({ user_id: userId, is_active: true }, { is_active: false, cancelled_at: new Date() });
        const start = startDate || new Date();
        const billingDays = plan.billing_cycle_days || 30;
        const end = new Date(start);
        end.setDate(end.getDate() + billingDays);
        const subscription = this.subscriptionRepository.create({
            user_id: userId,
            plan_id: planId,
            plan_type: plan.plan_type,
            start_date: start,
            end_date: end,
            is_active: true,
            order_id: orderId || null,
        });
        const saved = await this.subscriptionRepository.save(subscription);
        user.current_plan = plan.plan_type;
        await this.userRepository.save(user);
        return saved;
    }
    async upgradeSubscription(userId, newPlanId, orderId) {
        const currentSubscription = await this.getCurrentSubscription(userId);
        const newPlan = await this.planRepository.findOne({ where: { id: newPlanId, is_deleted: false } });
        if (!newPlan) {
            throw new common_1.NotFoundException('Plan not found');
        }
        return this.createSubscription(userId, newPlanId, new Date(), orderId);
    }
    async cancelSubscription(userId, reason) {
        const subscription = await this.getCurrentSubscription(userId);
        if (!subscription) {
            throw new common_1.NotFoundException('No active subscription found');
        }
        subscription.is_active = false;
        subscription.cancelled_at = new Date();
        subscription.cancellation_reason = reason || null;
        await this.subscriptionRepository.save(subscription);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
            user.current_plan = plan_type_enum_1.PlanType.FREE;
            await this.userRepository.save(user);
        }
    }
    async findById(id) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['user', 'plan', 'order'],
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        return subscription;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map