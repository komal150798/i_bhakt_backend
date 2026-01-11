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
exports.BaseEntity = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const user_entity_1 = require("../../users/entities/user.entity");
class BaseEntity {
    generateUniqueId() {
        if (!this.unique_id) {
            this.unique_id = (0, uuid_1.v4)();
        }
    }
    updateModifyDate() {
        this.modify_date = new Date();
    }
}
exports.BaseEntity = BaseEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], BaseEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], BaseEntity.prototype, "unique_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'added_date' }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "added_date", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "modify_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_enabled' }),
    __metadata("design:type", Boolean)
], BaseEntity.prototype, "is_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_deleted' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], BaseEntity.prototype, "is_deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'added_by' }),
    __metadata("design:type", Number)
], BaseEntity.prototype, "added_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'modify_by' }),
    __metadata("design:type", Number)
], BaseEntity.prototype, "modify_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'added_by', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], BaseEntity.prototype, "addedByUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'modify_by', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], BaseEntity.prototype, "modifiedByUser", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseEntity.prototype, "generateUniqueId", null);
__decorate([
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseEntity.prototype, "updateModifyDate", null);
//# sourceMappingURL=base.entity.js.map