"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaWebModule = void 0;
const common_1 = require("@nestjs/common");
const web_users_controller_1 = require("../users/controllers/web/web-users.controller");
const web_subscription_controller_1 = require("../subscriptions/controllers/web-subscription.controller");
const web_entitlements_controller_1 = require("../subscriptions/controllers/web-entitlements.controller");
const users_module_1 = require("../users/users.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const plans_module_1 = require("../plans/plans.module");
const kundli_module_1 = require("../kundli/kundli.module");
let SpaWebModule = class SpaWebModule {
};
exports.SpaWebModule = SpaWebModule;
exports.SpaWebModule = SpaWebModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, subscriptions_module_1.SubscriptionsModule, plans_module_1.PlansModule, kundli_module_1.KundliModule],
        controllers: [web_users_controller_1.WebUsersController, web_subscription_controller_1.WebSubscriptionController, web_entitlements_controller_1.WebEntitlementsController],
    })
], SpaWebModule);
//# sourceMappingURL=spa-web.module.js.map