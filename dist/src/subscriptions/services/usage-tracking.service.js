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
exports.UsageTrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usage_tracking_entity_1 = require("../entities/usage-tracking.entity");
const subscription_entity_1 = require("../entities/subscription.entity");
const subscriptions_service_1 = require("./subscriptions.service");
let UsageTrackingService = class UsageTrackingService {
    constructor(usageTrackingRepository, subscriptionRepository, subscriptionsService) {
        this.usageTrackingRepository = usageTrackingRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.subscriptionsService = subscriptionsService;
    }
    async trackUsage(userId, moduleSlug, actionType, increment = 1) {
        const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
        if (!subscription) {
            throw new Error('No active subscription found');
        }
        const plan = subscription.plan;
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        currentPeriod.setHours(0, 0, 0, 0);
        let usage = await this.usageTrackingRepository.findOne({
            where: {
                user_id: userId,
                module_slug: moduleSlug,
                action_type: actionType,
                period: currentPeriod,
            },
        });
        if (!usage) {
            const limit = plan.usage_limits?.[actionType] || null;
            usage = this.usageTrackingRepository.create({
                user_id: userId,
                subscription_id: subscription.id,
                module_slug: moduleSlug,
                action_type: actionType,
                usage_count: increment,
                limit,
                period: currentPeriod,
            });
        }
        else {
            usage.usage_count += increment;
        }
        return this.usageTrackingRepository.save(usage);
    }
    async canPerformAction(userId, moduleSlug, actionType) {
        const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
        if (!subscription) {
            return { allowed: false };
        }
        const plan = subscription.plan;
        const limit = plan.usage_limits?.[actionType];
        if (!limit) {
            return { allowed: true };
        }
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        currentPeriod.setHours(0, 0, 0, 0);
        const usage = await this.usageTrackingRepository.findOne({
            where: {
                user_id: userId,
                module_slug: moduleSlug,
                action_type: actionType,
                period: currentPeriod,
            },
        });
        const currentUsage = usage?.usage_count || 0;
        const allowed = currentUsage < limit;
        return {
            allowed,
            usage,
            limit,
        };
    }
    async getUserUsageLimits(userId) {
        const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
        if (!subscription) {
            return {};
        }
        const plan = subscription.plan;
        const limits = plan.usage_limits || {};
        const currentPeriod = new Date();
        currentPeriod.setDate(1);
        currentPeriod.setHours(0, 0, 0, 0);
        const usageRecords = await this.usageTrackingRepository.find({
            where: {
                user_id: userId,
                period: currentPeriod,
            },
        });
        const result = {};
        for (const [actionType, limit] of Object.entries(limits)) {
            const usage = usageRecords.find((r) => r.action_type === actionType);
            result[actionType] = {
                limit,
                used: usage?.usage_count || 0,
                remaining: limit - (usage?.usage_count || 0),
            };
        }
        return result;
    }
};
exports.UsageTrackingService = UsageTrackingService;
exports.UsageTrackingService = UsageTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usage_tracking_entity_1.UsageTracking)),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        subscriptions_service_1.SubscriptionsService])
], UsageTrackingService);
//# sourceMappingURL=usage-tracking.service.js.map