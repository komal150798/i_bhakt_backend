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
exports.ZunoImmutableEntity = exports.ZunoVersionedEntity = exports.ZunoBaseEntity = void 0;
const typeorm_1 = require("typeorm");
class ZunoBaseEntity {
}
exports.ZunoBaseEntity = ZunoBaseEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ZunoBaseEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], ZunoBaseEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], ZunoBaseEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoBaseEntity.prototype, "deleted_at", void 0);
class ZunoVersionedEntity extends ZunoBaseEntity {
}
exports.ZunoVersionedEntity = ZunoVersionedEntity;
__decorate([
    (0, typeorm_1.VersionColumn)({ type: 'int', name: 'version', default: 1 }),
    __metadata("design:type", Number)
], ZunoVersionedEntity.prototype, "version", void 0);
class ZunoImmutableEntity {
}
exports.ZunoImmutableEntity = ZunoImmutableEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ZunoImmutableEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], ZunoImmutableEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'redacted_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoImmutableEntity.prototype, "redacted_at", void 0);
//# sourceMappingURL=zuno-base.entity.js.map