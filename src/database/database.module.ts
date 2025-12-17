import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';

// Import all entities
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { UsageTracking } from '../subscriptions/entities/usage-tracking.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Product } from '../products/entities/product.entity';
import { Module as ModuleEntity } from '../modules/entities/module.entity';
import { Kundli } from '../kundli/entities/kundli.entity';
import { KundliPlanet } from '../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../kundli/entities/kundli-house.entity';
import { PlanetMaster } from '../kundli/entities/planet-master.entity';
import { NakshatraMaster } from '../kundli/entities/nakshatra-master.entity';
import { AyanamsaMaster } from '../kundli/entities/ayanamsa-master.entity';
import { KarmaEntry } from '../karma/entities/karma-entry.entity';
import { KarmaMasterGood } from '../karma/entities/karma-master-good.entity';
import { KarmaMasterBad } from '../karma/entities/karma-master-bad.entity';
import { ManifestationLog } from '../manifestation/entities/manifestation-log.entity';
import { CMSPage } from '../cms/entities/cms-page.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { SeedService } from './services/seed.service';

// Import all entities - Update paths based on where entities are located
const entities = [
  User,
  Plan,
  Subscription,
  UsageTracking,
  Order,
  Payment,
  Product,
  ModuleEntity,
  Kundli,
  KundliPlanet,
  KundliHouse,
  PlanetMaster,
  NakshatraMaster,
  AyanamsaMaster,
  KarmaEntry,
  KarmaMasterGood,
  KarmaMasterBad,
  ManifestationLog,
  CMSPage,
  Notification,
  AuditLog,
  RefreshToken,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        return {
          ...config,
          entities,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
