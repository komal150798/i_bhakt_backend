"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.entities = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = require("../../config/database.config");
const user_entity_1 = require("../../users/entities/user.entity");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
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
const notification_entity_1 = require("../../notifications/entities/notification.entity");
const audit_log_entity_1 = require("../../audit/entities/audit-log.entity");
const ai_prompt_entity_1 = require("../../common/ai/entities/ai-prompt.entity");
const app_constant_entity_1 = require("../../common/constants/entities/app-constant.entity");
const refresh_token_entity_1 = require("../../auth/entities/refresh-token.entity");
const admin_token_entity_1 = require("../../auth/entities/admin-token.entity");
const customer_token_entity_1 = require("../../auth/entities/customer-token.entity");
const adm_role_entity_1 = require("../../admin-rbac/entities/adm-role.entity");
const adm_permission_entity_1 = require("../../admin-rbac/entities/adm-permission.entity");
const adm_role_permission_entity_1 = require("../../admin-rbac/entities/adm-role-permission.entity");
const dasha_record_entity_1 = require("../../database/entities/dasha-record.entity");
const antardasha_record_entity_1 = require("../../database/entities/antardasha-record.entity");
const pratyantar_dasha_record_entity_1 = require("../../database/entities/pratyantar-dasha-record.entity");
const sukshma_dasha_record_entity_1 = require("../../database/entities/sukshma-dasha-record.entity");
const sms_template_entity_1 = require("../../common/messaging/entities/sms-template.entity");
const email_template_entity_1 = require("../../common/messaging/entities/email-template.entity");
const sms_credential_entity_1 = require("../../common/messaging/entities/sms-credential.entity");
const email_credential_entity_1 = require("../../common/messaging/entities/email-credential.entity");
const zuno_entities_1 = require("../../zuno/zuno-entities");
const seed_admin_service_1 = require("./seeds/seed-admin.service");
exports.entities = [
    admin_user_entity_1.AdminUser,
    customer_entity_1.Customer,
    user_entity_1.User,
    admin_token_entity_1.AdminToken,
    customer_token_entity_1.CustomerToken,
    refresh_token_entity_1.RefreshToken,
    adm_role_entity_1.AdmRole,
    adm_permission_entity_1.AdmPermission,
    adm_role_permission_entity_1.AdmRolePermission,
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
    notification_entity_1.Notification,
    audit_log_entity_1.AuditLog,
    ai_prompt_entity_1.AIPrompt,
    app_constant_entity_1.AppConstant,
    dasha_record_entity_1.DashaRecord,
    antardasha_record_entity_1.AntardashaRecord,
    pratyantar_dasha_record_entity_1.PratyantarDashaRecord,
    sukshma_dasha_record_entity_1.SukshmaDashaRecord,
    sms_template_entity_1.SmsTemplate,
    email_template_entity_1.EmailTemplate,
    sms_credential_entity_1.SmsCredential,
    email_credential_entity_1.EmailCredential,
    ...zuno_entities_1.ZUNO_ENTITIES,
];
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    constructor(seedService) {
        this.seedService = seedService;
        this.logger = new common_1.Logger(DatabaseModule_1.name);
    }
    async onModuleInit() {
        this.logger.log('⏳ Waiting for database tables to be created...');
        let tablesReady = false;
        let attempts = 0;
        const maxAttempts = 10;
        while (!tablesReady && attempts < maxAttempts) {
            attempts++;
            try {
                const result = await this.seedService.checkTableExists();
                if (result) {
                    tablesReady = true;
                    this.logger.log(`✅ Database tables are ready (attempt ${attempts})`);
                }
                else {
                    this.logger.log(`⏳ Tables not ready yet, waiting... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                if (error?.message?.includes('does not exist') || error?.code === '42P01') {
                    this.logger.log(`⏳ Tables not ready yet, waiting... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
                else {
                    this.logger.error(`❌ Error checking tables: ${error.message}`);
                    break;
                }
            }
        }
        if (!tablesReady) {
            this.logger.warn('⚠️  Expected tables were not found.');
            this.logger.warn('   The schema is managed by migrations (Step 20 §96, Build Rule 25).');
            this.logger.warn('   Run: npm run migration:run');
            this.logger.warn('   Migrations also run automatically on boot unless DB_MIGRATIONS_RUN=false.');
            this.logger.warn('   For local development only, DB_SYNCHRONIZE=true restores schema sync.');
        }
        this.logger.log('🌱 Starting admin user seeding...');
        await this.seedService.seedAdminUser();
    }
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule.forFeature(database_config_1.default)],
                useFactory: (configService) => {
                    const config = configService.get('database');
                    const isProduction = process.env.NODE_ENV === 'production';
                    const synchronize = isProduction
                        ? false
                        : process.env.DB_SYNCHRONIZE === 'true';
                    const migrationsRun = !synchronize && process.env.DB_MIGRATIONS_RUN !== 'false';
                    const finalConfig = {
                        ...config,
                        entities: exports.entities,
                        synchronize,
                        dropSchema: false,
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
                    console.log(`   Synchronize: ${synchronize}${isProduction ? ' (forced off in production)' : ''}`);
                    console.log(`   Migrations run on boot: ${migrationsRun}`);
                    console.log(`   Entities count: ${exports.entities.length}`);
                    if (synchronize) {
                        console.warn('   ⚠️  DB_SYNCHRONIZE=true - TypeORM will alter the schema by reflection.');
                        console.warn('      Use for local development only; migrations are the source of truth.');
                    }
                    return finalConfig;
                },
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature(exports.entities),
        ],
        providers: [seed_admin_service_1.SeedService],
        exports: [typeorm_1.TypeOrmModule],
    }),
    __metadata("design:paramtypes", [seed_admin_service_1.SeedService])
], DatabaseModule);
//# sourceMappingURL=database.module.js.map