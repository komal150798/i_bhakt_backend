import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';

export interface FeatureEntitlement {
  feature: string;
  allowed: boolean;
  limit?: number; // If limited, this is the max count
  current_usage?: number; // Current usage count
}

export interface UserEntitlements {
  plan_type: PlanType;
  plan_name: string;
  features: FeatureEntitlement[];
  usage_limits: Record<string, { limit: number; current: number }>;
}

/**
 * Centralized service for checking plan entitlements
 * All feature gating logic should go through this service
 */
@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger(EntitlementsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  /**
   * Get all entitlements for a user
   */
  async getUserEntitlements(userId: number): Promise<UserEntitlements> {
    // Get active subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        is_active: true,
        is_deleted: false,
      },
      relations: ['plan'],
    });

    const planType = subscription?.plan_type || PlanType.FREE;
    const plan = subscription?.plan || await this.planRepository.findOne({
      where: { plan_type: planType, is_deleted: false },
    });

    if (!plan) {
      // Return default FREE plan entitlements
      return this.getDefaultEntitlements(PlanType.FREE);
    }

    // Build entitlements based on plan
    const features = this.buildFeatureEntitlements(planType, plan);
    const usage_limits = plan.usage_limits || {};

    return {
      plan_type: planType,
      plan_name: plan.name,
      features,
      usage_limits: Object.entries(usage_limits).reduce((acc, [key, limit]) => {
        acc[key] = { limit: Number(limit), current: 0 }; // Current usage would be calculated separately
        return acc;
      }, {} as Record<string, { limit: number; current: number }>),
    };
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: number, feature: string): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    const featureEntitlement = entitlements.features.find(f => f.feature === feature);
    return featureEntitlement?.allowed || false;
  }

  /**
   * Check if user can perform an action (considering usage limits)
   */
  async canPerformAction(
    userId: number,
    action: string,
    currentUsage: number = 0,
  ): Promise<{ allowed: boolean; reason?: string }> {
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

  /**
   * Build feature entitlements based on plan type
   */
  private buildFeatureEntitlements(planType: PlanType, plan: Plan): FeatureEntitlement[] {
    const baseFeatures: FeatureEntitlement[] = [
      {
        feature: 'karma_journal',
        allowed: true,
        limit: planType === PlanType.FREE ? 5 : undefined, // FREE: 5/day, others: unlimited
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
        allowed: planType !== PlanType.FREE,
      },
      {
        feature: 'manifestation_journal',
        allowed: true,
        limit: planType === PlanType.FREE ? 3 : (planType === PlanType.REFERRAL ? 10 : undefined),
      },
      {
        feature: 'mfp_score',
        allowed: planType !== PlanType.FREE,
      },
      {
        feature: 'full_mfp_score',
        allowed: planType === PlanType.PAID || planType === PlanType.PREMIUM,
      },
      {
        feature: 'dharma_compass',
        allowed: planType === PlanType.PAID || planType === PlanType.PREMIUM,
      },
      {
        feature: 'karma_circles',
        allowed: planType === PlanType.PAID || planType === PlanType.PREMIUM,
      },
      {
        feature: 'weekly_insights',
        allowed: planType !== PlanType.FREE,
      },
      {
        feature: 'monthly_reports',
        allowed: planType === PlanType.PREMIUM,
      },
      {
        feature: 'ai_mentor_twin',
        allowed: planType === PlanType.PREMIUM,
      },
      {
        feature: 'premium_twin_skins',
        allowed: planType === PlanType.PREMIUM,
      },
      {
        feature: 'community_feed',
        allowed: true,
      },
      {
        feature: 'community_participate',
        allowed: planType !== PlanType.FREE,
      },
      {
        feature: 'challenges_basic',
        allowed: true,
      },
      {
        feature: 'challenges_premium',
        allowed: planType !== PlanType.FREE,
      },
      {
        feature: 'karma_coin_pre_earn',
        allowed: planType === PlanType.REFERRAL || planType === PlanType.PAID || planType === PlanType.PREMIUM,
      },
      {
        feature: 'karma_coin_multipliers',
        allowed: planType === PlanType.PREMIUM,
      },
    ];

    // Override with plan-specific features if defined
    if (plan.features && Array.isArray(plan.features)) {
      plan.features.forEach((planFeature: any) => {
        const existing = baseFeatures.find(f => f.feature === planFeature.slug || f.feature === planFeature.name?.toLowerCase().replace(/\s+/g, '_'));
        if (existing) {
          existing.allowed = true;
        } else {
          baseFeatures.push({
            feature: planFeature.slug || planFeature.name?.toLowerCase().replace(/\s+/g, '_'),
            allowed: true,
          });
        }
      });
    }

    return baseFeatures;
  }

  /**
   * Get default entitlements for a plan type (when plan not found)
   */
  private getDefaultEntitlements(planType: PlanType): UserEntitlements {
    const planName = planType === PlanType.FREE ? 'Awaken' :
                     planType === PlanType.REFERRAL ? 'Karma Builder' :
                     planType === PlanType.PAID ? 'Karma Pro' : 'Dharma Master';

    return {
      plan_type: planType,
      plan_name: planName,
      features: this.buildFeatureEntitlements(planType, null as any),
      usage_limits: {},
    };
  }

  /**
   * Get plan type for a user
   */
  async getUserPlanType(userId: number): Promise<PlanType> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        is_active: true,
        is_deleted: false,
      },
    });

    return subscription?.plan_type || PlanType.FREE;
  }
}

