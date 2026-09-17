import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../../config/database.config';

// Import all entities
import { User } from '../../users/entities/user.entity'; // Legacy - to be migrated
import { AdminUser } from '../../users/entities/admin-user.entity';
import { Customer } from '../../users/entities/customer.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { UsageTracking } from '../../subscriptions/entities/usage-tracking.entity';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Product } from '../../products/entities/product.entity';
import { Module as ModuleEntity } from '../../modules/entities/module.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { KundliPlanet } from '../../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../../kundli/entities/kundli-house.entity';
import { PlanetMaster } from '../../kundli/entities/planet-master.entity';
import { NakshatraMaster } from '../../kundli/entities/nakshatra-master.entity';
import { AyanamsaMaster } from '../../kundli/entities/ayanamsa-master.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AIPrompt } from '../../common/ai/entities/ai-prompt.entity';
import { AppConstant } from '../../common/constants/entities/app-constant.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity'; // Legacy - to be migrated
import { AdminToken } from '../../auth/entities/admin-token.entity';
import { CustomerToken } from '../../auth/entities/customer-token.entity';
import { AdmRole } from '../../admin-rbac/entities/adm-role.entity';
import { AdmPermission } from '../../admin-rbac/entities/adm-permission.entity';
import { AdmRolePermission } from '../../admin-rbac/entities/adm-role-permission.entity';
import { DashaRecord } from '../../database/entities/dasha-record.entity';
import { AntardashaRecord } from '../../database/entities/antardasha-record.entity';
import { PratyantarDashaRecord } from '../../database/entities/pratyantar-dasha-record.entity';
import { SukshmaDashaRecord } from '../../database/entities/sukshma-dasha-record.entity';
import { SmsTemplate } from '../../common/messaging/entities/sms-template.entity';
import { EmailTemplate } from '../../common/messaging/entities/email-template.entity';
import { SmsCredential } from '../../common/messaging/entities/sms-credential.entity';
import { EmailCredential } from '../../common/messaging/entities/email-credential.entity';
// ZUNO (Step 20 Data Model). Registered as one array exported by ZunoModule so
// that adding a ZUNO entity does not require editing this file again.
import { ZUNO_ENTITIES } from '../../zuno/zuno-entities';
import { SeedService } from './seeds/seed-admin.service';

/**
 * All entities array.
 *
 * Exported so a one-off bootstrap can create the legacy schema on a fresh
 * database. Most of these 90+ tables have never had a migration written - they
 * have only ever been created by `synchronize` - so a brand new database cannot
 * be built from migrations alone. See ZUNO_DECISION_LOG.md item 18.
 */
export const entities = [
  // User Management (Normalized)
  AdminUser, // adm_users
  Customer, // cst_customer
  User, // Legacy - to be migrated
  
  // Token Management (Normalized)
  AdminToken, // adm_tokens
  CustomerToken, // cst_tokens
  RefreshToken, // Legacy - to be migrated
  
  // RBAC (Role-Based Access Control)
  AdmRole, // adm_role
  AdmPermission, // adm_permission
  AdmRolePermission, // adm_role_permission
  
  // Business Entities
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
    Notification,
  AuditLog,
  // AI Prompt Management
  AIPrompt,
  // Central Constants
  AppConstant,
  // Dasha Period Entities
  DashaRecord,
  AntardashaRecord,
  PratyantarDashaRecord,
  SukshmaDashaRecord,
  // Messaging Entities
  SmsTemplate,
  EmailTemplate,
  SmsCredential,
  EmailCredential,
  // Contact
  // Testimonials

  // ZUNO domain entities (zuno_* tables)
  ...ZUNO_ENTITIES,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        const isProduction = process.env.NODE_ENV === 'production';

        /**
         * Schema management strategy.
         *
         * ZUNO Data Model (Step 20) section 96 and Claude Build Rule 25 require
         * schema changes to go through version-controlled migrations, and
         * Build Rule 25 adds: never alter a production schema as normal
         * deployment practice.
         *
         * This previously read `const forceSynchronize = true` unconditionally,
         * which meant TypeORM reshaped the schema by reflection on every boot -
         * in production too - and `migrationsRun: false` meant the migrations
         * in this folder had never run at all.
         *
         * `synchronize` is now opt-in and can never be enabled in production:
         *   - production                  -> always false, no exceptions
         *   - DB_SYNCHRONIZE=true         -> true (local convenience only)
         *   - otherwise                   -> false, migrations own the schema
         *
         * Every migration in this project is written with IF NOT EXISTS, so
         * enabling migrationsRun against a database whose tables were
         * previously created by synchronize is safe and simply records them as
         * applied.
         */
        const synchronize = isProduction
          ? false
          : process.env.DB_SYNCHRONIZE === 'true';

        // Migrations are the default way the schema moves. They are skipped
        // only while synchronize is deliberately in charge, so the two
        // mechanisms never race to define the same table in one boot.
        const migrationsRun =
          !synchronize && process.env.DB_MIGRATIONS_RUN !== 'false';

        const finalConfig = {
          ...config,
          entities, // Use explicit entities array (not path-based)
          synchronize,
          dropSchema: false, // Never drop schema
          migrationsRun,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsTableName: 'migrations_history',
        };

        console.log('🔧 TypeORM Final Configuration:');
        console.log(`   Type: ${finalConfig.type}`);
        console.log(`   Host: ${finalConfig.host}`);
        console.log(`   Port: ${finalConfig.port}`);
        console.log(`   Database: ${finalConfig.database}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'not set'}`);
        console.log(
          `   Synchronize: ${synchronize}${isProduction ? ' (forced off in production)' : ''}`,
        );
        console.log(`   Migrations run on boot: ${migrationsRun}`);
        console.log(`   Entities count: ${entities.length}`);

        if (synchronize) {
          console.warn(
            '   ⚠️  DB_SYNCHRONIZE=true - TypeORM will alter the schema by reflection.',
          );
          console.warn(
            '      Use for local development only; migrations are the source of truth.',
          );
        }

        return finalConfig;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    // Wait a bit for TypeORM to finish creating tables
    this.logger.log('⏳ Waiting for database tables to be created...');
    
    // Check if tables exist by trying to query
    let tablesReady = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!tablesReady && attempts < maxAttempts) {
      attempts++;
      try {
        // Try to check if users table exists
        const result = await this.seedService.checkTableExists();
        if (result) {
          tablesReady = true;
          this.logger.log(`✅ Database tables are ready (attempt ${attempts})`);
        } else {
          this.logger.log(`⏳ Tables not ready yet, waiting... (attempt ${attempts}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        }
      } catch (error: any) {
        if (error?.message?.includes('does not exist') || error?.code === '42P01') {
          this.logger.log(`⏳ Tables not ready yet, waiting... (attempt ${attempts}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        } else {
          this.logger.error(`❌ Error checking tables: ${error.message}`);
          break;
        }
      }
    }
    
    if (!tablesReady) {
      // Migrations, not synchronize, are now responsible for the schema, so the
      // remedy is to run them rather than to switch reflection back on.
      this.logger.warn('⚠️  Expected tables were not found.');
      this.logger.warn('   The schema is managed by migrations (Step 20 §96, Build Rule 25).');
      this.logger.warn('   Run: npm run migration:run');
      this.logger.warn('   Migrations also run automatically on boot unless DB_MIGRATIONS_RUN=false.');
      this.logger.warn('   For local development only, DB_SYNCHRONIZE=true restores schema sync.');
    }
    
    // Seed admin user on module initialization
    this.logger.log('🌱 Starting admin user seeding...');
    await this.seedService.seedAdminUser();
  }
}

