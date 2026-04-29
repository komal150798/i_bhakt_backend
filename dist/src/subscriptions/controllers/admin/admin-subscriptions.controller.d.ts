import { SubscriptionsService } from '../../services/subscriptions.service';
import { PlansService } from '../../../plans/services/plans.service';
import { PlanType } from '../../../common/enums/plan-type.enum';
import { Repository } from 'typeorm';
import { Subscription } from '../../entities/subscription.entity';
import { Plan } from '../../../plans/entities/plan.entity';
import { Order } from '../../../orders/entities/order.entity';
import { Payment } from '../../../payments/entities/payment.entity';
export declare class AdminSubscriptionsController {
    private readonly subscriptionsService;
    private readonly plansService;
    private readonly subscriptionRepository;
    private readonly planRepository;
    private readonly orderRepository;
    private readonly paymentRepository;
    constructor(subscriptionsService: SubscriptionsService, plansService: PlansService, subscriptionRepository: Repository<Subscription>, planRepository: Repository<Plan>, orderRepository: Repository<Order>, paymentRepository: Repository<Payment>);
    findAll(body: {
        page?: number;
        limit?: number;
        search?: string;
        plan_type?: PlanType;
        is_active?: boolean;
        user_id?: number;
    }): Promise<{
        success: boolean;
        data: {
            id: number;
            unique_id: string;
            user_id: number;
            user_email: string;
            user_name: string;
            plan_id: number;
            plan_name: string;
            plan_type: PlanType;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            is_renewal: boolean;
            cancelled_at: Date;
            cancellation_reason: string;
            added_date: Date;
            modify_date: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: {
            id: number;
            unique_id: string;
            user_id: number;
            user: {
                id: number;
                email: string;
                first_name: string;
                last_name: string;
            };
            plan_id: number;
            plan: {
                id: number;
                name: string;
                plan_type: PlanType;
            };
            plan_type: PlanType;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            is_renewal: boolean;
            order_id: number;
            cancelled_at: Date;
            cancellation_reason: string;
            added_date: Date;
            modify_date: Date;
        };
    }>;
    create(body: {
        user_id: number;
        plan_id: number;
        start_date?: string;
        end_date?: string;
        order_id?: number;
        create_offline_payment?: boolean;
        offline_source?: 'dev-offline' | 'admin-offline';
    }): Promise<{
        success: boolean;
        data: {
            id: number;
            user_id: number;
            plan_id: number;
            plan_type: PlanType;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            order_id: number;
        };
    }>;
    update(id: number, body: {
        plan_id?: number;
        start_date?: string;
        end_date?: string;
        is_active?: boolean;
        cancellation_reason?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: number;
            user_id: number;
            plan_id: number;
            plan_type: PlanType;
            start_date: Date;
            end_date: Date;
            is_active: boolean;
            cancelled_at: Date;
        };
    }>;
    cancel(id: number, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getAvailablePlans(): Promise<{
        success: boolean;
        data: import("../../../plans/dtos/plan-response.dto").PlanResponseDto[];
    }>;
}
