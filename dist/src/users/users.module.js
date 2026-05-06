"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_users_controller_1 = require("./controllers/admin/admin-users.controller");
const app_users_controller_1 = require("./controllers/app/app-users.controller");
const users_service_1 = require("./services/users.service");
const customer_service_1 = require("./services/customer.service");
const customer_entity_1 = require("./entities/customer.entity");
const admin_user_entity_1 = require("./entities/admin-user.entity");
const karma_entry_entity_1 = require("../karma/entities/karma-entry.entity");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const kundli_module_1 = require("../kundli/kundli.module");
const repositories_module_1 = require("../infrastructure/repositories/repositories.module");
const plans_module_1 = require("../plans/plans.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([customer_entity_1.Customer, admin_user_entity_1.AdminUser, karma_entry_entity_1.KarmaEntry]),
            subscriptions_module_1.SubscriptionsModule,
            plans_module_1.PlansModule,
            kundli_module_1.KundliModule,
            repositories_module_1.RepositoriesModule,
        ],
        controllers: [admin_users_controller_1.AdminUsersController, app_users_controller_1.AppUsersController],
        providers: [users_service_1.UsersService, customer_service_1.CustomerService],
        exports: [users_service_1.UsersService, customer_service_1.CustomerService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map