"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRbacModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const adm_role_entity_1 = require("./entities/adm-role.entity");
const adm_permission_entity_1 = require("./entities/adm-permission.entity");
const adm_role_permission_entity_1 = require("./entities/adm-role-permission.entity");
const admin_user_entity_1 = require("../users/entities/admin-user.entity");
const roles_service_1 = require("./services/roles.service");
const admin_users_service_1 = require("./services/admin-users.service");
const permissions_service_1 = require("./services/permissions.service");
const roles_controller_1 = require("./controllers/roles.controller");
const admin_users_controller_1 = require("./controllers/admin-users.controller");
let AdminRbacModule = class AdminRbacModule {
};
exports.AdminRbacModule = AdminRbacModule;
exports.AdminRbacModule = AdminRbacModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([adm_role_entity_1.AdmRole, adm_permission_entity_1.AdmPermission, adm_role_permission_entity_1.AdmRolePermission, admin_user_entity_1.AdminUser]),
        ],
        controllers: [roles_controller_1.RolesController, admin_users_controller_1.AdminUsersController],
        providers: [roles_service_1.RolesService, admin_users_service_1.AdminUsersService, permissions_service_1.PermissionsService],
        exports: [roles_service_1.RolesService, admin_users_service_1.AdminUsersService, permissions_service_1.PermissionsService],
    })
], AdminRbacModule);
//# sourceMappingURL=admin-rbac.module.js.map