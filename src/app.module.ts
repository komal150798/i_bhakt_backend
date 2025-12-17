import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AstrologyModule } from './astrology/astrology.module';
import { KundliModule } from './kundli/kundli.module';
import { HoroscopeModule } from './horoscope/horoscope.module';
import { KarmaModule } from './karma/karma.module';
import { ManifestationModule } from './manifestation/manifestation.module';
import { JournalModule } from './journal/journal.module';
import { ChallengesModule } from './challenges/challenges.module';
import { TwinModule } from './twin/twin.module';
import { MessagingModule } from './common/messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CmsModule } from './cms/cms.module';
import { ModulesModule } from './modules/modules.module';
import { AuditModule } from './audit/audit.module';
import { AdminRbacModule } from './admin-rbac/admin-rbac.module';
import { AIPromptModule } from './common/ai/ai-prompt.module';
import { ConstantsModule } from './common/constants/constants.module';
import { AdminController } from './controllers/admin/admin.controller';
import { HomeController } from './controllers/home/home.controller';
import { HomeKarmaController } from './controllers/home/karma.controller';
import { CustomerController } from './controllers/customer/customer.controller';
import { KarmaController } from './controllers/customer/karma.controller';
import { AppController } from './controllers/app/app.controller';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, redisConfig],
    }),
    DatabaseModule,
    RedisModule,
    RepositoriesModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    PlansModule,
    SubscriptionsModule,
    OrdersModule,
    PaymentsModule,
    AstrologyModule,
    KundliModule,
    HoroscopeModule,
    KarmaModule,
    ManifestationModule,
    JournalModule,
    ChallengesModule,
    TwinModule,
    MessagingModule,
    NotificationsModule,
    CmsModule,
    ModulesModule,
    AuditModule,
    AdminRbacModule,
    AIPromptModule, // AI Prompt Management System
    ConstantsModule, // Central Constants Service
  ],
  controllers: [
    AdminController,
    HomeController,
    HomeKarmaController,
    CustomerController,
    KarmaController,
    AppController,
  ],
})
export class AppModule {}
