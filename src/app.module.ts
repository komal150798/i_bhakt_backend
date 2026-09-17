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
import { MessagingModule } from './common/messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModulesModule } from './modules/modules.module';
import { AuditModule } from './audit/audit.module';
import { AdminRbacModule } from './admin-rbac/admin-rbac.module';
import { AIPromptModule } from './common/ai/ai-prompt.module';
import { ConstantsModule } from './common/constants/constants.module';
import { ZunoModule } from './zuno/zuno.module';
import { SpaWebModule } from './spa/spa-web.module';
import { AdminController } from './controllers/admin/admin.controller';
import { HomeController } from './controllers/home/home.controller';
import { ReferController } from './controllers/home/refer.controller';
import { CustomerController } from './controllers/customer/customer.controller';
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
    SpaWebModule,
    OrdersModule,
    PaymentsModule,
    AstrologyModule,
    KundliModule,
    MessagingModule,
    NotificationsModule,
    ModulesModule,
    AuditModule,
    AdminRbacModule,
    AIPromptModule, // AI Prompt Management System
    ConstantsModule, // Central Constants Service
    ZunoModule, // ZUNO - WhatNow life-navigation domain (zuno_* tables)
  ],
  controllers: [
    AdminController,
    HomeController,
    ReferController,
    CustomerController,
    AppController,
  ],
})
export class AppModule {}
