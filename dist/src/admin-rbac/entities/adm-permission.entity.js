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
exports.AdmPermission = void 0;
const typeorm_1 = require("typeorm");
const adm_role_permission_entity_1 = require("./adm-role-permission.entity");
let AdmPermission = class AdmPermission {
};
exports.AdmPermission = AdmPermission;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', primary: true, name: 'permission_id' }),
    __metadata("design:type", Number)
], AdmPermission.prototype, "permission_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'menu_name' }),
    __metadata("design:type", String)
], AdmPermission.prototype, "menu_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'has_submenu' }),
    __metadata("design:type", Boolean)
], AdmPermission.prototype, "has_submenu", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'parent_id' }),
    __metadata("design:type", Number)
], AdmPermission.prototype, "parent_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_enabled' }),
    __metadata("design:type", Boolean)
], AdmPermission.prototype, "is_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_deleted' }),
    __metadata("design:type", Boolean)
], AdmPermission.prototype, "is_deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'added_by' }),
    __metadata("design:type", Number)
], AdmPermission.prototype, "added_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'modify_by' }),
    __metadata("design:type", Number)
], AdmPermission.prototype, "modify_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'added_date', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmPermission.prototype, "added_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmPermission.prototype, "modify_date", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AdmPermission, (permission) => permission.children, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id', referencedColumnName: 'permission_id' }),
    __metadata("design:type", AdmPermission)
], AdmPermission.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AdmPermission, (permission) => permission.parent),
    __metadata("design:type", Array)
], AdmPermission.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adm_role_permission_entity_1.AdmRolePermission, (rolePermission) => rolePermission.permission),
    __metadata("design:type", Array)
], AdmPermission.prototype, "role_permissions", void 0);
exports.AdmPermission = AdmPermission = __decorate([
    (0, typeorm_1.Entity)('adm_permission'),
    (0, typeorm_1.Index)(['parent_id', 'is_deleted'])
], AdmPermission);
//# sourceMappingURL=adm-permission.entity.js.map