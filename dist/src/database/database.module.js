"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../users/entities/user.entity");
const plan_entity_1 = require("../plans/entities/plan.entity");
const subscription_entity_1 = require("../subscriptions/entities/subscription.entity");
const usage_tracking_entity_1 = require("../subscriptions/entities/usage-tracking.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const product_entity_1 = require("../products/entities/product.entity");
const module_entity_1 = require("../modules/entities/module.entity");
const kundli_entity_1 = require("../kundli/entities/kundli.entity");
const kundli_planet_entity_1 = require("../kundli/entities/kundli-planet.entity");
const kundli_house_entity_1 = require("../kundli/entities/kundli-house.entity");
const planet_master_entity_1 = require("../kundli/entities/planet-master.entity");
const nakshatra_master_entity_1 = require("../kundli/entities/nakshatra-master.entity");
const ayanamsa_master_entity_1 = require("../kundli/entities/ayanamsa-master.entity");
const karma_entry_entity_1 = require("../karma/entities/karma-entry.entity");
const karma_master_good_entity_1 = require("../karma/entities/karma-master-good.entity");
const karma_master_bad_entity_1 = require("../karma/entities/karma-master-bad.entity");
const manifestation_log_entity_1 = require("../manifestation/entities/manifestation-log.entity");
const cms_page_entity_1 = require("../cms/entities/cms-page.entity");
const notification_entity_1 = require("../notifications/entities/notification.entity");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const refresh_token_entity_1 = require("../auth/entities/refresh-token.entity");
const seed_service_1 = require("./services/seed.service");
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
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule.forFeature(database_config_1.default)],
                useFactory: (configService) => {
                    const config = configService.get('database');
                    return {
                        ...config,
                        entities,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature(entities),
        ],
        providers: [seed_service_1.SeedService],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map