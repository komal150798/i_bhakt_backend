import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Customer } from '../../users/entities/customer.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { PlanType } from '../../common/enums/plan-type.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  /**
   * Get user's current active subscription
   */
  async getCurrentSubscription(userId: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        is_active: true,
        is_deleted: false,
        end_date: MoreThan(new Date()),
      },
      relations: ['plan', 'plan.modules'],
      order: { start_date: 'DESC' },
    });
  }

  /**
   * Get user's current plan type (FREE if no active subscription)
   */
  async getCurrentPlanType(userId: number): Promise<PlanType> {
    const subscription = await this.getCurrentSubscription(userId);
    return subscription?.plan_type || PlanType.FREE;
  }

  /**
   * Check if user has access to a module
   */
  async hasModuleAccess(userId: number, moduleSlug: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      return false; // FREE plan - no module access (or check FREE plan modules)
    }

    const plan = subscription.plan;
    if (!plan.modules || plan.modules.length === 0) {
      return false;
    }

    return plan.modules.some((module) => module.slug === moduleSlug);
  }

  /**
   * Get all modules user has access to
   */
  async getUserModules(userId: number): Promise<string[]> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      return []; // FREE plan - no modules
    }

    const plan = subscription.plan;
    return plan.modules?.map((m) => m.slug) || [];
  }

  /**
   * Create new subscription
   */
  async createSubscription(
    userId: number,
    planId: number,
    startDate?: Date,
    orderId?: number,
  ): Promise<Subscription> {
    if (orderId) {
      const existingForOrder = await this.subscriptionRepository.findOne({
        where: { user_id: userId, order_id: orderId, is_deleted: false },
      });
      if (existingForOrder) {
        return existingForOrder;
      }
    }

    const customer = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const plan = await this.planRepository.findOne({ where: { id: planId, is_deleted: false } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Deactivate existing subscriptions
    await this.subscriptionRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false, cancelled_at: new Date() },
    );

    // Calculate end date
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

    // Update customer's current plan
    customer.current_plan = plan.plan_type;
    await this.customerRepository.save(customer);

    return saved;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(userId: number, newPlanId: number, orderId?: number): Promise<Subscription> {
    const currentSubscription = await this.getCurrentSubscription(userId);
    const newPlan = await this.planRepository.findOne({ where: { id: newPlanId, is_deleted: false } });

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // TODO: Calculate proration if needed
    // For now, create new subscription immediately
    return this.createSubscription(userId, newPlanId, new Date(), orderId);
  }

  /**
   * Cancel subscription (end at period end)
   */
  async cancelSubscription(userId: number, reason?: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.is_active = false;
    subscription.cancelled_at = new Date();
    subscription.cancellation_reason = reason || null;

    await this.subscriptionRepository.save(subscription);

    // Update customer to FREE plan
    const customer = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
    if (customer) {
      customer.current_plan = PlanType.FREE;
      await this.customerRepository.save(customer);
    }
  }

  /**
   * Get subscription by ID (for admin)
   */
  async findById(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['customer', 'plan', 'order'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}





