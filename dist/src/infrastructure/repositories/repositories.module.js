"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const module_entity_1 = require("../../modules/entities/module.entity");
const kundli_entity_1 = require("../../kundli/entities/kundli.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const order_entity_1 = require("../../orders/entities/order.entity");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const subscription_entity_1 = require("../../subscriptions/entities/subscription.entity");
const cms_page_entity_1 = require("../../cms/entities/cms-page.entity");
const karma_entry_entity_1 = require("../../karma/entities/karma-entry.entity");
const manifestation_log_entity_1 = require("../../manifestation/entities/manifestation-log.entity");
const plan_repository_1 = require("./plan.repository");
const kundli_repository_1 = require("./kundli.repository");
const user_repository_1 = require("./user.repository");
const order_repository_1 = require("./order.repository");
const payment_repository_1 = require("./payment.repository");
const subscription_repository_1 = require("./subscription.repository");
const cms_repository_1 = require("./cms.repository");
const karma_repository_1 = require("./karma.repository");
const manifestation_repository_1 = require("./manifestation.repository");
let RepositoriesModule = class RepositoriesModule {
};
exports.RepositoriesModule = RepositoriesModule;
exports.RepositoriesModule = RepositoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                plan_entity_1.Plan,
                module_entity_1.Module,
                kundli_entity_1.Kundli,
                user_entity_1.User,
                order_entity_1.Order,
                payment_entity_1.Payment,
                subscription_entity_1.Subscription,
                cms_page_entity_1.CMSPage,
                karma_entry_entity_1.KarmaEntry,
                manifestation_log_entity_1.ManifestationLog,
            ]),
        ],
        providers: [
            {
                provide: 'IPlanRepository',
                useClass: plan_repository_1.PlanRepository,
            },
            {
                provide: 'IKundliRepository',
                useClass: kundli_repository_1.KundliRepository,
            },
            {
                provide: 'IUserRepository',
                useClass: user_repository_1.UserRepository,
            },
            {
                provide: 'IOrderRepository',
                useClass: order_repository_1.OrderRepository,
            },
            {
                provide: 'IPaymentRepository',
                useClass: payment_repository_1.PaymentRepository,
            },
            {
                provide: 'ISubscriptionRepository',
                useClass: subscription_repository_1.SubscriptionRepository,
            },
            {
                provide: 'ICMSRepository',
                useClass: cms_repository_1.CMSRepository,
            },
            {
                provide: 'IKarmaRepository',
                useClass: karma_repository_1.KarmaRepository,
            },
            {
                provide: 'IManifestationRepository',
                useClass: manifestation_repository_1.ManifestationRepository,
            },
        ],
        exports: [
            'IPlanRepository',
            'IKundliRepository',
            'IUserRepository',
            'IOrderRepository',
            'IPaymentRepository',
            'ISubscriptionRepository',
            'ICMSRepository',
            'IKarmaRepository',
            'IManifestationRepository',
        ],
    })
], RepositoriesModule);
//# sourceMappingURL=repositories.module.js.map