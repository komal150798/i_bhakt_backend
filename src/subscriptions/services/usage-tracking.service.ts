import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageTracking } from '../entities/usage-tracking.entity';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class UsageTrackingService {
  constructor(
    @InjectRepository(UsageTracking)
    private usageTrackingRepository: Repository<UsageTracking>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Track usage for a module action
   */
  async trackUsage(
    userId: number,
    moduleSlug: string,
    actionType: string,
    increment: number = 1,
  ): Promise<UsageTracking> {
    const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const plan = subscription.plan;
    const currentPeriod = new Date();
    currentPeriod.setDate(1); // First day of month
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
    } else {
      usage.usage_count += increment;
    }

    return this.usageTrackingRepository.save(usage);
  }

  /**
   * Check if user can perform an action (within limits)
   */
  async canPerformAction(
    userId: number,
    moduleSlug: string,
    actionType: string,
  ): Promise<{ allowed: boolean; usage?: UsageTracking; limit?: number }> {
    const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
    if (!subscription) {
      return { allowed: false };
    }

    const plan = subscription.plan;
    const limit = plan.usage_limits?.[actionType];

    if (!limit) {
      return { allowed: true }; // No limit set
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

  /**
   * Get user's usage limits for all modules
   */
  async getUserUsageLimits(userId: number): Promise<Record<string, any>> {
    const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
    if (!subscription) {
      return {}; // FREE plan - no limits
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

    const result: Record<string, any> = {};

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
}







