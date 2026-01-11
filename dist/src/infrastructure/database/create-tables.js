"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
try {
    require('dotenv').config();
}
catch (e) {
}
const user_entity_1 = require("../../users/entities/user.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const subscription_entity_1 = require("../../subscriptions/entities/subscription.entity");
const usage_tracking_entity_1 = require("../../subscriptions/entities/usage-tracking.entity");
const order_entity_1 = require("../../orders/entities/order.entity");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const product_entity_1 = require("../../products/entities/product.entity");
const module_entity_1 = require("../../modules/entities/module.entity");
const kundli_entity_1 = require("../../kundli/entities/kundli.entity");
const kundli_planet_entity_1 = require("../../kundli/entities/kundli-planet.entity");
const kundli_house_entity_1 = require("../../kundli/entities/kundli-house.entity");
const planet_master_entity_1 = require("../../kundli/entities/planet-master.entity");
const nakshatra_master_entity_1 = require("../../kundli/entities/nakshatra-master.entity");
const ayanamsa_master_entity_1 = require("../../kundli/entities/ayanamsa-master.entity");
const karma_entry_entity_1 = require("../../karma/entities/karma-entry.entity");
const karma_master_good_entity_1 = require("../../karma/entities/karma-master-good.entity");
const karma_master_bad_entity_1 = require("../../karma/entities/karma-master-bad.entity");
const manifestation_log_entity_1 = require("../../manifestation/entities/manifestation-log.entity");
const cms_page_entity_1 = require("../../cms/entities/cms-page.entity");
const notification_entity_1 = require("../../notifications/entities/notification.entity");
const audit_log_entity_1 = require("../../audit/entities/audit-log.entity");
const refresh_token_entity_1 = require("../../auth/entities/refresh-token.entity");
const entities = [
    user_entity_1.User,
    plan_entity_1.Plan,
    subscription_entity_1.Subscription,
    usage_tracking_entity_1.UsageTracking,
    order_entity_1.Order,
    payment_entity_1.Payment,
    product_entity_1.Product,
    module_entity_1.Module,
    kundli_entity_1.Kundli,
    kundli_planet_entity_1.KundliPlanet,
    kundli_house_entity_1.KundliHouse,
    planet_master_entity_1.PlanetMaster,
    nakshatra_master_entity_1.NakshatraMaster,
    ayanamsa_master_entity_1.AyanamsaMaster,
    karma_entry_entity_1.KarmaEntry,
    karma_master_good_entity_1.KarmaMasterGood,
    karma_master_bad_entity_1.KarmaMasterBad,
    manifestation_log_entity_1.ManifestationLog,
    cms_page_entity_1.CMSPage,
    notification_entity_1.Notification,
    audit_log_entity_1.AuditLog,
    refresh_token_entity_1.RefreshToken,
];
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ib_db',
    entities,
    synchronize: true,
    logging: true,
    dropSchema: false,
});
async function createTables() {
    try {
        const options = dataSource.options;
        console.log('🔌 Connecting to database...');
        console.log(`   Host: ${options.host}`);
        console.log(`   Port: ${options.port}`);
        console.log(`   Database: ${options.database}`);
        console.log(`   Synchronize: ${options.synchronize}`);
        console.log(`   Entities: ${entities.length}`);
        await dataSource.initialize();
        console.log('✅ Connected to database!');
        console.log('📊 Synchronizing schema (creating tables)...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const queryRunner = dataSource.createQueryRunner();
        const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
        console.log(`\n✅ Found ${tables.length} tables in database:`);
        tables.forEach((table) => {
            console.log(`   - ${table.table_name}`);
        });
        await dataSource.destroy();
        console.log('\n✅ Done! Tables should now be visible in pgAdmin.');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}
createTables();
//# sourceMappingURL=create-tables.js.map