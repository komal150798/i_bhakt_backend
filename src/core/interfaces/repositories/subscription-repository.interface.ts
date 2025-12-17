import { Subscription } from '../../../subscriptions/entities/subscription.entity';
import { PlanType } from '../../../common/enums/plan-type.enum';

export interface CreateSubscriptionInput {
  user_id: number;
  plan_id: number;
  plan_type: PlanType;
  start_date: Date;
  end_date?: Date | null;
  is_active?: boolean;
  is_renewal?: boolean;
  order_id?: number | null;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
}

export interface UpdateSubscriptionInput {
  plan_type?: PlanType;
  start_date?: Date;
  end_date?: Date | null;
  is_active?: boolean;
  is_renewal?: boolean;
  order_id?: number | null;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
}

export interface ISubscriptionRepository {
  findById(id: number): Promise<Subscription | null>;
  findByUniqueId(uniqueId: string): Promise<Subscription | null>;
  findByUserId(userId: number, options?: { is_active?: boolean }): Promise<Subscription[]>;
  findActiveByUserId(userId: number): Promise<Subscription | null>;
  findAll(options?: { is_active?: boolean }): Promise<Subscription[]>;
  create(data: CreateSubscriptionInput): Promise<Subscription>;
  update(subscription: Subscription, data: UpdateSubscriptionInput): Promise<Subscription>;
  delete(subscription: Subscription): Promise<void>;
}

