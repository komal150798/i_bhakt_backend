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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUser = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const admin_token_entity_1 = require("../../auth/entities/admin-token.entity");
const adm_role_entity_1 = require("../../admin-rbac/entities/adm-role.entity");
let AdminUser = class AdminUser extends base_entity_1.BaseEntity {
};
exports.AdminUser = AdminUser;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AdminUser.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, unique: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "first_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "last_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], AdminUser.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'last_login' }),
    __metadata("design:type", Date)
], AdminUser.prototype, "last_login", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'last_login_ip' }),
    __metadata("design:type", String)
], AdminUser.prototype, "last_login_ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'role_id' }),
    __metadata("design:type", Number)
], AdminUser.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => adm_role_entity_1.AdmRole, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id', referencedColumnName: 'role_id' }),
    __metadata("design:type", adm_role_entity_1.AdmRole)
], AdminUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => admin_token_entity_1.AdminToken, (token) => token.admin),
    __metadata("design:type", Array)
], AdminUser.prototype, "tokens", void 0);
exports.AdminUser = AdminUser = __decorate([
    (0, typeorm_1.Entity)('adm_users'),
    (0, typeorm_1.Index)(['username', 'is_deleted'], { unique: true }),
    (0, typeorm_1.Index)(['email', 'is_deleted'], { unique: true })
], AdminUser);
//# sourceMappingURL=admin-user.entity.js.map