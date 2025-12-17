import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './services/subscriptions.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { EntitlementsService } from './services/entitlements.service';
import { Subscription } from './entities/subscription.entity';
import { UsageTracking } from './entities/usage-tracking.entity';
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { AppSubscriptionController } from './controllers/app-subscription.controller';
import { AppEntitlementsController } from './controllers/app-entitlements.controller';
import { AdminSubscriptionsController } from './controllers/admin/admin-subscriptions.controller';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, UsageTracking, User, Plan]),
    PlansModule,
  ],
  controllers: [
    AppSubscriptionController,
    AppEntitlementsController,
    AdminSubscriptionsController,
  ],
  providers: [SubscriptionsService, UsageTrackingService, EntitlementsService],
  exports: [SubscriptionsService, UsageTrackingService, EntitlementsService],
})
export class SubscriptionsModule {}





