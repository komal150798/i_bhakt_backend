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
import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { KarmaMasterGood } from '../../karma/entities/karma-master-good.entity';
import { KarmaMasterBad } from '../../karma/entities/karma-master-bad.entity';
import { KarmaCategory } from '../../karma/entities/karma-category.entity';
import { KarmaWeightRule } from '../../karma/entities/karma-weight-rule.entity';
import { KarmaHabitSuggestion } from '../../karma/entities/karma-habit-suggestion.entity';
import { KarmaPattern } from '../../karma/entities/karma-pattern.entity';
import { KarmaScoreSummary } from '../../karma/entities/karma-score-summary.entity';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import { Manifestation } from '../../manifestation/entities/manifestation.entity';
// New database-driven AI system entities
import {
  ManifestCategory,
  ManifestSubcategory,
  ManifestKeyword,
  ManifestEnergyRule,
  ManifestRitualTemplate,
  ManifestToManifestTemplate,
  ManifestNotToManifestTemplate,
  ManifestAlignmentTemplate,
  ManifestInsightTemplate,
  ManifestSummaryTemplate,
  ManifestBackendCache,
  ManifestUserLog,
} from '../../manifestation/entities';
import { CMSPage } from '../../cms/entities/cms-page.entity';
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
import { SeedService } from './seeds/seed-admin.service';

// All entities array
const entities = [
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
  KarmaEntry,
  KarmaMasterGood,
  KarmaMasterBad,
  KarmaCategory,
  KarmaWeightRule,
  KarmaHabitSuggestion,
  KarmaPattern,
  KarmaScoreSummary,
  ManifestationLog,
  Manifestation,
  // New database-driven AI system entities
  ManifestCategory,
  ManifestSubcategory,
  ManifestKeyword,
  ManifestEnergyRule,
  ManifestRitualTemplate,
  ManifestToManifestTemplate,
  ManifestNotToManifestTemplate,
  ManifestAlignmentTemplate,
  ManifestInsightTemplate,
  ManifestSummaryTemplate,
  ManifestBackendCache,
  ManifestUserLog,
  CMSPage,
  Notification,
  AuditLog,
  // AI Prompt Management
  AIPrompt,
  // Central Constants
  AppConstant,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        // Force synchronize to be true for development - CRITICAL FOR TABLE CREATION
        const forceSynchronize = true; // Always enable for now to ensure tables are created
        const finalConfig = {
          ...config,
          entities, // Use explicit entities array (not path-based)
          synchronize: forceSynchronize, // FORCE TRUE - this creates tables
          dropSchema: false, // Never drop schema
          migrationsRun: false, // Don't run migrations
        };
        
        // Log the final configuration
        console.log('🔧 TypeORM Final Configuration:');
        console.log(`   Type: ${finalConfig.type}`);
        console.log(`   Host: ${finalConfig.host}`);
        console.log(`   Port: ${finalConfig.port}`);
        console.log(`   Database: ${finalConfig.database}`);
        console.log(`   Synchronize: ${finalConfig.synchronize} ✅ FORCED TO TRUE`);
        console.log(`   Entities count: ${entities.length}`);
        console.log(`   Entity names: ${entities.map(e => e.name || e.constructor.name).join(', ')}`);
        
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
      this.logger.warn('⚠️  Tables may not have been created. Check TypeORM synchronize is enabled.');
      this.logger.warn('   Verify in logs: "TypeORM successfully connected to database"');
      this.logger.warn('   Check .env has: NODE_ENV=development or DB_SYNCHRONIZE=true');
    }
    
    // Seed admin user on module initialization
    this.logger.log('🌱 Starting admin user seeding...');
    await this.seedService.seedAdminUser();
  }
}

