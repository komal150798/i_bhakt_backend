import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Plan } from '../plans/entities/plan.entity';
import { RazorpayService } from './services/razorpay.service';
import { RazorpayCheckoutService } from './services/razorpay-checkout.service';
import { RazorpayAppController } from './controllers/razorpay-app.controller';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, Plan]),
    PlansModule,
    SubscriptionsModule,
  ],
  controllers: [RazorpayAppController],
  providers: [RazorpayService, RazorpayCheckoutService],
  exports: [RazorpayService, RazorpayCheckoutService],
})
export class PaymentsModule {}







