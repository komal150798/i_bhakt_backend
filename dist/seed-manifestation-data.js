"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const seed_manifestation_master_data_service_1 = require("./src/manifestation/seeds/seed-manifestation-master-data.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('SeedManifestationData');
    try {
        logger.log('🚀 Starting Manifestation Data Seeding...');
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
            logger: ['log', 'error', 'warn'],
        });
        const seedService = app.get(seed_manifestation_master_data_service_1.SeedManifestationMasterDataService);
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
    }
    catch (error) {
        logger.error('❌ Error seeding manifestation data:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=seed-manifestation-data.js.map