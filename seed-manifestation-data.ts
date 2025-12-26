/**
 * Script to seed manifestation master data
 * 
 * Run this script to populate all manifestation tables with initial data:
 * - Categories (career, love, wealth, health, etc.)
 * - Subcategories
 * - Keywords for category detection
 * - Energy rules for energy state detection
 * - Templates for rituals, insights, alignment, etc.
 * 
 * Usage:
 *   npm run seed:manifestation
 *   or
 *   ts-node seed-manifestation-data.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SeedManifestationMasterDataService } from './src/manifestation/seeds/seed-manifestation-master-data.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedManifestationData');
  
  try {
    logger.log('🚀 Starting Manifestation Data Seeding...');
    
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Get the seed service
    const seedService = app.get(SeedManifestationMasterDataService);
    
    // Run the seed (it will run automatically on module init, but we can also call it explicitly)
    await seedService.onModuleInit();
    
    logger.log('✅ Manifestation Data Seeding Complete!');
    logger.log('');
    logger.log('📊 Summary:');
    logger.log('   - Categories seeded');
    logger.log('   - Subcategories seeded');
    logger.log('   - Keywords seeded');
    logger.log('   - Energy rules seeded');
    logger.log('   - Templates seeded');
    logger.log('');
    logger.log('🔄 The backend_config will now be populated with this data.');
    logger.log('🤖 The LLM will automatically use this data for analysis.');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding manifestation data:', error);
    process.exit(1);
  }
}

bootstrap();






