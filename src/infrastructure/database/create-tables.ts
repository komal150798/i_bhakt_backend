/**
 * Manual Table Creation Script
 * Run this to force create all tables: npx ts-node src/infrastructure/database/create-tables.ts
 */

import { DataSource } from 'typeorm';

// Load .env if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use process.env directly
}

// Import all entities
import { User } from '../../users/entities/user.entity';
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
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import { CMSPage } from '../../cms/entities/cms-page.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

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

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ib_db',
  entities,
  synchronize: true, // Force synchronize
  logging: true, // Show all SQL
  dropSchema: false, // Never drop
});

async function createTables() {
  try {
    const options = dataSource.options as any; // Type assertion for postgres options
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${options.host}`);
    console.log(`   Port: ${options.port}`);
    console.log(`   Database: ${options.database}`);
    console.log(`   Synchronize: ${options.synchronize}`);
    console.log(`   Entities: ${entities.length}`);
    
    await dataSource.initialize();
    console.log('✅ Connected to database!');
    
    console.log('📊 Synchronizing schema (creating tables)...');
    // TypeORM will automatically create tables when synchronize is true
    // Just wait a moment for it to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Verify tables were created
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n✅ Found ${tables.length} tables in database:`);
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`);
    });
    
    await dataSource.destroy();
    console.log('\n✅ Done! Tables should now be visible in pgAdmin.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTables();

