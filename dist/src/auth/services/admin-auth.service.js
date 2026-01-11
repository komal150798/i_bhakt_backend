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
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const user_role_enum_1 = require("../../common/enums/user-role.enum");
const jwt_service_1 = require("./jwt.service");
const permissions_service_1 = require("../../admin-rbac/services/permissions.service");
let AdminAuthService = class AdminAuthService {
    constructor(adminUserRepository, userRepository, jwtService, permissionsService) {
        this.adminUserRepository = adminUserRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.permissionsService = permissionsService;
    }
    async login(username, password) {
        let admin = await this.adminUserRepository.findOne({
            where: [
                { email: username, is_deleted: false, is_active: true },
                { username: username, is_deleted: false, is_active: true },
            ],
            relations: ['role'],
        });
        if (admin) {
            if (!admin.password) {
                throw new common_1.UnauthorizedException('Password not set for this admin');
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            admin.last_login = new Date();
            await this.adminUserRepository.save(admin);
            const permissions = await this.permissionsService.getUserPermissions(admin.id);
            const roleName = admin.role?.role_name || 'ADMIN';
            const isSuperAdmin = admin.role?.is_master === true;
            const payload = {
                sub: admin.id,
                unique_id: admin.unique_id,
                email: admin.email,
                role: isSuperAdmin ? user_role_enum_1.UserRole.SUPER_ADMIN : user_role_enum_1.UserRole.ADMIN,
                type: 'admin',
            };
            const accessToken = this.jwtService.generateAccessToken(payload);
            const refreshToken = this.jwtService.generateRefreshToken(payload);
            return {
                access_token: accessToken,
                refresh_token: refreshToken,
                user: {
                    id: admin.id,
                    unique_id: admin.unique_id,
                    email: admin.email,
                    name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username,
                    role: isSuperAdmin ? 'super_admin' : roleName.toLowerCase(),
                    role_id: admin.role_id || null,
                    role_name: admin.role?.role_name || null,
                    is_master: admin.role?.is_master || false,
                    permissions,
                },
            };
        }
        const userAdmin = await this.userRepository.findOne({
            where: [
                { email: username, role: user_role_enum_1.UserRole.ADMIN, is_deleted: false },
                { phone_number: username, role: user_role_enum_1.UserRole.ADMIN, is_deleted: false },
            ],
        });
        if (!userAdmin) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!userAdmin.password) {
            throw new common_1.UnauthorizedException('Password not set for this admin');
        }
        const isPasswordValid = await bcrypt.compare(password, userAdmin.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if ('last_login' in userAdmin) {
            userAdmin.last_login = new Date();
            await this.userRepository.save(userAdmin);
        }
        const permissions = [];
        const payload = {
            sub: userAdmin.id,
            unique_id: userAdmin.unique_id,
            email: userAdmin.email || userAdmin.phone_number,
            role: userAdmin.role,
            type: 'admin',
        };
        const accessToken = this.jwtService.generateAccessToken(payload);
        const refreshToken = this.jwtService.generateRefreshToken(payload);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: userAdmin.id,
                unique_id: userAdmin.unique_id,
                email: userAdmin.email || userAdmin.phone_number,
                name: `${userAdmin.first_name || ''} ${userAdmin.last_name || ''}`.trim() || userAdmin.phone_number,
                role: userAdmin.role,
                role_id: null,
                permissions,
            },
        };
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_service_1.AuthJwtService,
        permissions_service_1.PermissionsService])
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map