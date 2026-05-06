import { Module } from '@nestjs/common';
import { WebUsersController } from '../users/controllers/web/web-users.controller';
import { WebSubscriptionController } from '../subscriptions/controllers/web-subscription.controller';
import { WebEntitlementsController } from '../subscriptions/controllers/web-entitlements.controller';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { KundliModule } from '../kundli/kundli.module';

/**
 * Browser SPA API surface: `/api/v1/users/*`, `/api/v1/subscription/*`, `/api/v1/entitlements/*`.
 * Registered here (not only inside UsersModule/SubscriptionsModule) so routes always bind on app bootstrap.
 */
@Module({
  imports: [UsersModule, SubscriptionsModule, PlansModule, KundliModule],
  controllers: [WebUsersController, WebSubscriptionController, WebEntitlementsController],
})
export class SpaWebModule {}
