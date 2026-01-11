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
exports.CustomerToken = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
let CustomerToken = class CustomerToken extends base_entity_1.BaseEntity {
};
exports.CustomerToken = CustomerToken;
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], CustomerToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'customer_id' }),
    __metadata("design:type", Number)
], CustomerToken.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expires_at' }),
    __metadata("design:type", Date)
], CustomerToken.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_revoked' }),
    __metadata("design:type", Boolean)
], CustomerToken.prototype, "is_revoked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'device_info' }),
    __metadata("design:type", String)
], CustomerToken.prototype, "device_info", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' }),
    __metadata("design:type", String)
], CustomerToken.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, name: 'login_method' }),
    __metadata("design:type", String)
], CustomerToken.prototype, "login_method", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id', referencedColumnName: 'id' }),
    __metadata("design:type", customer_entity_1.Customer)
], CustomerToken.prototype, "customer", void 0);
exports.CustomerToken = CustomerToken = __decorate([
    (0, typeorm_1.Entity)('cst_tokens'),
    (0, typeorm_1.Index)(['customer_id', 'is_revoked']),
    (0, typeorm_1.Index)(['token', 'is_revoked']),
    (0, typeorm_1.Index)(['expires_at'])
], CustomerToken);
//# sourceMappingURL=customer-token.entity.js.map