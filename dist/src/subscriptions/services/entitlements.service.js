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
var EntitlementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../entities/subscription.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
let EntitlementsService = EntitlementsService_1 = class EntitlementsService {
    constructor(subscriptionRepository, planRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.logger = new common_1.Logger(EntitlementsService_1.name);
    }
    async getUserEntitlements(userId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: {
                user_id: userId,
                is_active: true,
                is_deleted: false,
            },
            relations: ['plan'],
        });
        const planType = subscription?.plan_type || plan_type_enum_1.PlanType.FREE;
        const plan = subscription?.plan || await this.planRepository.findOne({
            where: { plan_type: planType, is_deleted: false },
        });
        if (!plan) {
            return this.getDefaultEntitlements(plan_type_enum_1.PlanType.FREE);
        }
        const features = this.buildFeatureEntitlements(planType, plan);
        const usage_limits = plan.usage_limits || {};
        return {
            plan_type: planType,
            plan_name: plan.name,
            features,
            usage_limits: Object.entries(usage_limits).reduce((acc, [key, limit]) => {
                acc[key] = { limit: Number(limit), current: 0 };
                return acc;
            }, {}),
        };
    }
    async hasFeatureAccess(userId, feature) {
        const entitlements = await this.getUserEntitlements(userId);
        const featureEntitlement = entitlements.features.find(f => f.feature === feature);
        return featureEntitlement?.allowed || false;
    }
    async canPerformAction(userId, action, currentUsage = 0) {
        const entitlements = await this.getUserEntitlements(userId);
        const featureEntitlement = entitlements.features.find(f => f.feature === action);
        if (!featureEntitlement || !featureEntitlement.allowed) {
            return { allowed: false, reason: 'Feature not available in your plan' };
        }
        if (featureEntitlement.limit !== undefined) {
            if (currentUsage >= featureEntitlement.limit) {
                return {
                    allowed: false,
                    reason: `Usage limit reached (${featureEntitlement.limit}/${featureEntitlement.limit})`,
                };
            }
        }
        return { allowed: true };
    }
    buildFeatureEntitlements(planType, plan) {
        const baseFeatures = [
            {
                feature: 'karma_journal',
                allowed: true,
                limit: planType === plan_type_enum_1.PlanType.FREE ? 5 : undefined,
            },
            {
                feature: 'karma_dashboard',
                allowed: true,
            },
            {
                feature: 'basic_karma_score',
                allowed: true,
            },
            {
                feature: 'digital_twin_static',
                allowed: true,
            },
            {
                feature: 'digital_twin_evolving',
                allowed: planType !== plan_type_enum_1.PlanType.FREE,
            },
            {
                feature: 'manifestation_journal',
                allowed: true,
                limit: planType === plan_type_enum_1.PlanType.FREE ? 3 : (planType === plan_type_enum_1.PlanType.REFERRAL ? 10 : undefined),
            },
            {
                feature: 'mfp_score',
                allowed: planType !== plan_type_enum_1.PlanType.FREE,
            },
            {
                feature: 'full_mfp_score',
                allowed: planType === plan_type_enum_1.PlanType.PAID || planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'dharma_compass',
                allowed: planType === plan_type_enum_1.PlanType.PAID || planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'karma_circles',
                allowed: planType === plan_type_enum_1.PlanType.PAID || planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'weekly_insights',
                allowed: planType !== plan_type_enum_1.PlanType.FREE,
            },
            {
                feature: 'monthly_reports',
                allowed: planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'ai_mentor_twin',
                allowed: planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'premium_twin_skins',
                allowed: planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'community_feed',
                allowed: true,
            },
            {
                feature: 'community_participate',
                allowed: planType !== plan_type_enum_1.PlanType.FREE,
            },
            {
                feature: 'challenges_basic',
                allowed: true,
            },
            {
                feature: 'challenges_premium',
                allowed: planType !== plan_type_enum_1.PlanType.FREE,
            },
            {
                feature: 'karma_coin_pre_earn',
                allowed: planType === plan_type_enum_1.PlanType.REFERRAL || planType === plan_type_enum_1.PlanType.PAID || planType === plan_type_enum_1.PlanType.PREMIUM,
            },
            {
                feature: 'karma_coin_multipliers',
                allowed: planType === plan_type_enum_1.PlanType.PREMIUM,
            },
        ];
        if (plan.features && Array.isArray(plan.features)) {
            plan.features.forEach((planFeature) => {
                const existing = baseFeatures.find(f => f.feature === planFeature.slug || f.feature === planFeature.name?.toLowerCase().replace(/\s+/g, '_'));
                if (existing) {
                    existing.allowed = true;
                }
                else {
                    baseFeatures.push({
                        feature: planFeature.slug || planFeature.name?.toLowerCase().replace(/\s+/g, '_'),
                        allowed: true,
                    });
                }
            });
        }
        return baseFeatures;
    }
    getDefaultEntitlements(planType) {
        const planName = planType === plan_type_enum_1.PlanType.FREE ? 'Awaken' :
            planType === plan_type_enum_1.PlanType.REFERRAL ? 'Karma Builder' :
                planType === plan_type_enum_1.PlanType.PAID ? 'Karma Pro' : 'Dharma Master';
        return {
            plan_type: planType,
            plan_name: planName,
            features: this.buildFeatureEntitlements(planType, null),
            usage_limits: {},
        };
    }
    async getUserPlanType(userId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: {
                user_id: userId,
                is_active: true,
                is_deleted: false,
            },
        });
        return subscription?.plan_type || plan_type_enum_1.PlanType.FREE;
    }
};
exports.EntitlementsService = EntitlementsService;
exports.EntitlementsService = EntitlementsService = EntitlementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EntitlementsService);
//# sourceMappingURL=entitlements.service.js.map