"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./infrastructure/database/database.module");
const redis_module_1 = require("./infrastructure/cache/redis.module");
const repositories_module_1 = require("./infrastructure/repositories/repositories.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const products_module_1 = require("./products/products.module");
const plans_module_1 = require("./plans/plans.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const astrology_module_1 = require("./astrology/astrology.module");
const kundli_module_1 = require("./kundli/kundli.module");
const horoscope_module_1 = require("./horoscope/horoscope.module");
const karma_module_1 = require("./karma/karma.module");
const manifestation_module_1 = require("./manifestation/manifestation.module");
const journal_module_1 = require("./journal/journal.module");
const challenges_module_1 = require("./challenges/challenges.module");
const twin_module_1 = require("./twin/twin.module");
const messaging_module_1 = require("./common/messaging/messaging.module");
const notifications_module_1 = require("./notifications/notifications.module");
const cms_module_1 = require("./cms/cms.module");
const modules_module_1 = require("./modules/modules.module");
const audit_module_1 = require("./audit/audit.module");
const admin_rbac_module_1 = require("./admin-rbac/admin-rbac.module");
const ai_prompt_module_1 = require("./common/ai/ai-prompt.module");
const constants_module_1 = require("./common/constants/constants.module");
const contact_module_1 = require("./contact/contact.module");
const testimonial_module_1 = require("./testimonial/testimonial.module");
const admin_controller_1 = require("./controllers/admin/admin.controller");
const home_controller_1 = require("./controllers/home/home.controller");
const karma_controller_1 = require("./controllers/home/karma.controller");
const refer_controller_1 = require("./controllers/home/refer.controller");
const customer_controller_1 = require("./controllers/customer/customer.controller");
const karma_controller_2 = require("./controllers/customer/karma.controller");
const app_controller_1 = require("./controllers/app/app.controller");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                load: [database_config_1.default, redis_config_1.default],
            }),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            repositories_module_1.RepositoriesModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            plans_module_1.PlansModule,
            subscriptions_module_1.SubscriptionsModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            astrology_module_1.AstrologyModule,
            kundli_module_1.KundliModule,
            horoscope_module_1.HoroscopeModule,
            karma_module_1.KarmaModule,
            manifestation_module_1.ManifestationModule,
            journal_module_1.JournalModule,
            challenges_module_1.ChallengesModule,
            twin_module_1.TwinModule,
            messaging_module_1.MessagingModule,
            notifications_module_1.NotificationsModule,
            cms_module_1.CmsModule,
            modules_module_1.ModulesModule,
            audit_module_1.AuditModule,
            admin_rbac_module_1.AdminRbacModule,
            ai_prompt_module_1.AIPromptModule,
            constants_module_1.ConstantsModule,
            contact_module_1.ContactModule,
            testimonial_module_1.TestimonialModule,
        ],
        controllers: [
            admin_controller_1.AdminController,
            home_controller_1.HomeController,
            karma_controller_1.HomeKarmaController,
            refer_controller_1.ReferController,
            customer_controller_1.CustomerController,
            karma_controller_2.KarmaController,
            app_controller_1.AppController,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map