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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, userRepository, customerRepository, adminUserRepository) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || 'your-secret-key-change-in-production-min-32-chars',
        });
        this.configService = configService;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.adminUserRepository = adminUserRepository;
    }
    async validate(payload) {
        if (!payload || !payload.sub) {
            throw new common_1.UnauthorizedException('Invalid token payload: missing user ID');
        }
        const userId = payload.sub;
        const userType = payload.type || 'user';
        if (userType === 'admin') {
            const admin = await this.adminUserRepository.findOne({
                where: { id: userId, is_deleted: false, is_active: true },
            });
            if (!admin) {
                console.warn(`Admin user not found for ID: ${userId}`);
                throw new common_1.UnauthorizedException('Admin user not found or inactive');
            }
            return {
                id: admin.id,
                unique_id: admin.unique_id,
                email: admin.email,
                username: admin.username,
                role: user_role_enum_1.UserRole.ADMIN,
                type: 'admin',
            };
        }
        else {
            let customer = await this.customerRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (customer) {
                return {
                    id: customer.id,
                    unique_id: customer.unique_id,
                    email: customer.email,
                    phone_number: customer.phone_number,
                    role: user_role_enum_1.UserRole.USER,
                    type: 'user',
                };
            }
            const user = await this.userRepository.findOne({
                where: { id: userId, is_deleted: false },
            });
            if (!user) {
                console.warn(`User not found for ID: ${userId}, type: ${userType}`);
                throw new common_1.UnauthorizedException('User not found');
            }
            return {
                id: user.id,
                unique_id: user.unique_id,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role,
                type: payload.type || 'user',
            };
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(3, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map