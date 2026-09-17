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
exports.ZunoIdempotencyKey = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
let ZunoIdempotencyKey = class ZunoIdempotencyKey extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoIdempotencyKey = ZunoIdempotencyKey;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], ZunoIdempotencyKey.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ZunoIdempotencyKey.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'idempotency_key' }),
    __metadata("design:type", String)
], ZunoIdempotencyKey.prototype, "idempotency_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'request_hash' }),
    __metadata("design:type", String)
], ZunoIdempotencyKey.prototype, "request_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'response_reference', nullable: true }),
    __metadata("design:type", Object)
], ZunoIdempotencyKey.prototype, "response_reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: 'IN_PROGRESS' }),
    __metadata("design:type", String)
], ZunoIdempotencyKey.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'expires_at' }),
    __metadata("design:type", Date)
], ZunoIdempotencyKey.prototype, "expires_at", void 0);
exports.ZunoIdempotencyKey = ZunoIdempotencyKey = __decorate([
    (0, typeorm_1.Entity)('zuno_idempotency_keys'),
    (0, typeorm_1.Index)('idx_zuno_idempotency_unique', ['operation', 'idempotency_key'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('idx_zuno_idempotency_expiry', ['expires_at'])
], ZunoIdempotencyKey);
//# sourceMappingURL=zuno-idempotency-key.entity.js.map