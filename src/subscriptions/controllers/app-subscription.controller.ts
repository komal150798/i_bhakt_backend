import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { SubscriptionsService } from '../services/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscription (App)')
@Controller('app/subscription')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppSubscriptionController {
  constructor(
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * GET /api/v1/app/subscription/plans
   * Get all available subscription plans
   */
  @Get('plans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscription plans (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
  })
  async getPlans(@CurrentUser() user: any) {
    const plans = await this.plansService.findAll({ is_enabled: true });

    return {
      success: true,
      data: plans.map((plan) => ({
        unique_id: plan.unique_id,
        plan_type: plan.plan_type,
        name: plan.name,
        description: plan.description,
        monthly_price: plan.monthly_price,
        yearly_price: plan.yearly_price,
        currency: plan.currency,
        billing_cycle_days: plan.billing_cycle_days,
        features: plan.features || [],
        is_popular: plan.is_popular || false,
      })),
    };
  }

  /**
   * POST /api/v1/app/subscription/verify
   * Verify subscription payment and activate subscription
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify subscription payment (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription verified and activated',
  })
  async verifySubscription(
    @Body() body: {
      plan_id: number;
      payment_id: string;
      payment_provider: 'stripe' | 'razorpay';
      order_id?: number;
    },
    @CurrentUser() user: any,
  ) {
    // TODO: Verify payment with payment provider (Stripe/Razorpay)
    // For now, create subscription directly
    
    // Verify payment (stub - implement actual verification)
    const paymentVerified = await this.verifyPayment(
      body.payment_id,
      body.payment_provider,
    );

    if (!paymentVerified) {
      return {
        success: false,
        message: 'Payment verification failed',
      };
    }

    // Create or upgrade subscription
    const subscription = await this.subscriptionsService.createSubscription(
      user.id,
      body.plan_id,
      new Date(),
      body.order_id,
    );

    return {
      success: true,
      data: {
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: subscription.is_active,
        message: 'Subscription activated successfully',
      },
    };
  }

  /**
   * GET /api/v1/app/subscription/current
   * Get current subscription
   */
  @Get('current')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current subscription (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription retrieved',
  })
  async getCurrentSubscription(@CurrentUser() user: any) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(
      user.id,
    );
    const planType = await this.subscriptionsService.getCurrentPlanType(user.id);

    return {
      success: true,
      data: {
        plan_type: planType,
        subscription: subscription
          ? {
              id: subscription.id,
              plan_id: subscription.plan_id,
              start_date: subscription.start_date,
              end_date: subscription.end_date,
              is_active: subscription.is_active,
            }
          : null,
      },
    };
  }

  /**
   * Verify payment with provider (stub - implement actual verification)
   */
  private async verifyPayment(
    paymentId: string,
    provider: 'stripe' | 'razorpay',
  ): Promise<boolean> {
    // TODO: Implement actual payment verification
    // - For Stripe: Use Stripe API to verify payment intent
    // - For Razorpay: Use Razorpay API to verify payment
    
    // Stub implementation
    return paymentId && paymentId.length > 0;
  }
}

