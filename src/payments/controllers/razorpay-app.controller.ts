import { Body, Controller, ForbiddenException, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRazorpayOrderDto } from '../dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from '../dto/verify-razorpay-payment.dto';
import { RazorpayCheckoutService } from '../services/razorpay-checkout.service';
import { SubscriptionsService } from '../../subscriptions/services/subscriptions.service';

@ApiTags('Payments — Razorpay (App)')
@Controller('app/payments/razorpay')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RazorpayAppController {
  constructor(
    private readonly checkout: RazorpayCheckoutService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  @Post('order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Razorpay order + local pending order',
    description:
      'Returns key_id and razorpay_order_id for Razorpay Checkout. Amount is in paise. After client pays, call POST verify with signature.',
  })
  async createOrder(@CurrentUser() user: any, @Body() dto: CreateRazorpayOrderDto) {
    this.assertCustomer(user);
    const billing = dto.billing ?? 'yearly';
    const data = await this.checkout.createOrderForPlan(user.id, dto.plan_unique_id, billing);
    return {
      success: true,
      data,
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Razorpay payment signature and activate subscription',
  })
  async verify(@CurrentUser() user: any, @Body() dto: VerifyRazorpayPaymentDto) {
    this.assertCustomer(user);
    const { plan_id, local_order_id } = await this.checkout.verifySignatureAndCapture(
      user.id,
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );

    const subscription = await this.subscriptions.createSubscription(
      user.id,
      plan_id,
      new Date(),
      local_order_id,
    );

    return {
      success: true,
      data: {
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        order_id: local_order_id,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: subscription.is_active,
      },
    };
  }

  private assertCustomer(user: { type?: string }) {
    if (user?.type !== 'user') {
      throw new ForbiddenException('Only customer accounts can purchase subscriptions');
    }
  }
}
