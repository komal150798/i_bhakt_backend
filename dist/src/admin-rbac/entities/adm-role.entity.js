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
exports.AdmRole = void 0;
const typeorm_1 = require("typeorm");
const adm_role_permission_entity_1 = require("./adm-role-permission.entity");
let AdmRole = class AdmRole {
};
exports.AdmRole = AdmRole;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'integer', name: 'role_id' }),
    __metadata("design:type", Number)
], AdmRole.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', default: () => 'gen_random_uuid()', name: 'unique_id' }),
    __metadata("design:type", String)
], AdmRole.prototype, "unique_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'role_name' }),
    __metadata("design:type", String)
], AdmRole.prototype, "role_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'role_level' }),
    __metadata("design:type", Number)
], AdmRole.prototype, "role_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_enabled' }),
    __metadata("design:type", Boolean)
], AdmRole.prototype, "is_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_deleted' }),
    __metadata("design:type", Boolean)
], AdmRole.prototype, "is_deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'added_by' }),
    __metadata("design:type", Number)
], AdmRole.prototype, "added_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'modify_by' }),
    __metadata("design:type", Number)
], AdmRole.prototype, "modify_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'added_date', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmRole.prototype, "added_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AdmRole.prototype, "modify_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_master' }),
    __metadata("design:type", Boolean)
], AdmRole.prototype, "is_master", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_editable' }),
    __metadata("design:type", Boolean)
], AdmRole.prototype, "is_editable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'checker_maker' }),
    __metadata("design:type", Number)
], AdmRole.prototype, "checker_maker", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adm_role_permission_entity_1.AdmRolePermission, (rolePermission) => rolePermission.role),
    __metadata("design:type", Array)
], AdmRole.prototype, "role_permissions", void 0);
exports.AdmRole = AdmRole = __decorate([
    (0, typeorm_1.Entity)('adm_role'),
    (0, typeorm_1.Index)(['role_name', 'is_deleted'])
], AdmRole);
//# sourceMappingURL=adm-role.entity.js.map