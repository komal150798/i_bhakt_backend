"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const subscriptions_service_1 = require("./services/subscriptions.service");
const usage_tracking_service_1 = require("./services/usage-tracking.service");
const entitlements_service_1 = require("./services/entitlements.service");
const subscription_entity_1 = require("./entities/subscription.entity");
const usage_tracking_entity_1 = require("./entities/usage-tracking.entity");
const customer_entity_1 = require("../users/entities/customer.entity");
const plan_entity_1 = require("../plans/entities/plan.entity");
const app_subscription_controller_1 = require("./controllers/app-subscription.controller");
const app_entitlements_controller_1 = require("./controllers/app-entitlements.controller");
const admin_subscriptions_controller_1 = require("./controllers/admin/admin-subscriptions.controller");
const plans_module_1 = require("../plans/plans.module");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([subscription_entity_1.Subscription, usage_tracking_entity_1.UsageTracking, customer_entity_1.Customer, plan_entity_1.Plan]),
            plans_module_1.PlansModule,
        ],
        controllers: [
            app_subscription_controller_1.AppSubscriptionController,
            app_entitlements_controller_1.AppEntitlementsController,
            admin_subscriptions_controller_1.AdminSubscriptionsController,
        ],
        providers: [subscriptions_service_1.SubscriptionsService, usage_tracking_service_1.UsageTrackingService, entitlements_service_1.EntitlementsService],
        exports: [subscriptions_service_1.SubscriptionsService, usage_tracking_service_1.UsageTrackingService, entitlements_service_1.EntitlementsService],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map