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
exports.AdmRolePermission = void 0;
const typeorm_1 = require("typeorm");
const adm_role_entity_1 = require("./adm-role.entity");
const adm_permission_entity_1 = require("./adm-permission.entity");
let AdmRolePermission = class AdmRolePermission {
};
exports.AdmRolePermission = AdmRolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'integer', name: 'ar_id' }),
    __metadata("design:type", Number)
], AdmRolePermission.prototype, "ar_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'role_id' }),
    __metadata("design:type", Number)
], AdmRolePermission.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'permission_id' }),
    __metadata("design:type", Number)
], AdmRolePermission.prototype, "permission_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_allowed' }),
    __metadata("design:type", Boolean)
], AdmRolePermission.prototype, "is_allowed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'added_by' }),
    __metadata("design:type", Number)
], AdmRolePermission.prototype, "added_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'modify_by' }),
    __metadata("design:type", Number)
], AdmRolePermission.prototype, "modify_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'added_date', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmRolePermission.prototype, "added_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmRolePermission.prototype, "modify_date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => adm_role_entity_1.AdmRole, (role) => role.role_permissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id', referencedColumnName: 'role_id' }),
    __metadata("design:type", adm_role_entity_1.AdmRole)
], AdmRolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => adm_permission_entity_1.AdmPermission, (permission) => permission.role_permissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permission_id', referencedColumnName: 'permission_id' }),
    __metadata("design:type", adm_permission_entity_1.AdmPermission)
], AdmRolePermission.prototype, "permission", void 0);
exports.AdmRolePermission = AdmRolePermission = __decorate([
    (0, typeorm_1.Entity)('adm_role_permission'),
    (0, typeorm_1.Index)(['role_id', 'permission_id'])
], AdmRolePermission);
//# sourceMappingURL=adm-role-permission.entity.js.map