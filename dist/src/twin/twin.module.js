"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwinModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const twin_gateway_1 = require("./twin.gateway");
const twin_state_service_1 = require("./services/twin-state.service");
const digital_twin_service_1 = require("./services/digital-twin.service");
const app_twin_controller_1 = require("./controllers/app-twin.controller");
const customer_entity_1 = require("../users/entities/customer.entity");
const manifestation_entity_1 = require("../manifestation/entities/manifestation.entity");
const manifestation_log_entity_1 = require("../manifestation/entities/manifestation-log.entity");
const journal_entry_entity_1 = require("../journal/entities/journal-entry.entity");
const karma_entry_entity_1 = require("../karma/entities/karma-entry.entity");
const karma_module_1 = require("../karma/karma.module");
const repositories_module_1 = require("../infrastructure/repositories/repositories.module");
const users_module_1 = require("../users/users.module");
let TwinModule = class TwinModule {
};
exports.TwinModule = TwinModule;
exports.TwinModule = TwinModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([customer_entity_1.Customer, manifestation_entity_1.Manifestation, manifestation_log_entity_1.ManifestationLog, journal_entry_entity_1.JournalEntry, karma_entry_entity_1.KarmaEntry]),
            karma_module_1.KarmaModule,
            repositories_module_1.RepositoriesModule,
            users_module_1.UsersModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'your-secret-key',
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [twin_gateway_1.TwinGateway, twin_state_service_1.TwinStateService, digital_twin_service_1.DigitalTwinService],
        controllers: [app_twin_controller_1.AppTwinController],
        exports: [twin_gateway_1.TwinGateway, twin_state_service_1.TwinStateService, digital_twin_service_1.DigitalTwinService],
    })
], TwinModule);
//# sourceMappingURL=twin.module.js.map