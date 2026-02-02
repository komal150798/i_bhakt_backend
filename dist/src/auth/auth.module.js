"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const admin_auth_controller_1 = require("./controllers/admin/admin-auth.controller");
const web_auth_controller_1 = require("./controllers/web/web-auth.controller");
const app_auth_controller_1 = require("./controllers/app/app-auth.controller");
const auth_controller_1 = require("./controllers/auth.controller");
const auth_service_1 = require("./auth.service");
const admin_auth_service_1 = require("./services/admin-auth.service");
const otp_service_1 = require("./services/otp.service");
const jwt_service_1 = require("./services/jwt.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const customer_entity_1 = require("../users/entities/customer.entity");
const admin_user_entity_1 = require("../users/entities/admin-user.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const customer_token_entity_1 = require("./entities/customer-token.entity");
const admin_token_entity_1 = require("./entities/admin-token.entity");
const admin_rbac_module_1 = require("../admin-rbac/admin-rbac.module");
const adm_role_entity_1 = require("../admin-rbac/entities/adm-role.entity");
const horoscope_module_1 = require("../horoscope/horoscope.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET') || 'your-secret-key-change-in-production-min-32-chars',
                    signOptions: {
                        expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([customer_entity_1.Customer, admin_user_entity_1.AdminUser, refresh_token_entity_1.RefreshToken, customer_token_entity_1.CustomerToken, admin_token_entity_1.AdminToken, adm_role_entity_1.AdmRole]),
            admin_rbac_module_1.AdminRbacModule,
            horoscope_module_1.HoroscopeModule,
        ],
        controllers: [
            admin_auth_controller_1.AdminAuthController,
            web_auth_controller_1.WebAuthController,
            app_auth_controller_1.AppAuthController,
            auth_controller_1.AuthController,
        ],
        providers: [auth_service_1.AuthService, admin_auth_service_1.AdminAuthService, otp_service_1.OtpService, jwt_service_1.AuthJwtService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService, admin_auth_service_1.AdminAuthService, jwt_service_1.AuthJwtService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map