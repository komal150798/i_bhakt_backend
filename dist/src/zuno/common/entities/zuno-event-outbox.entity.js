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
exports.ZunoEventOutbox = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../enums");
let ZunoEventOutbox = class ZunoEventOutbox extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoEventOutbox = ZunoEventOutbox;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'aggregate_type' }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "aggregate_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'aggregate_id' }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "aggregate_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'event_type' }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'event_version', default: '1' }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "event_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ZunoEventOutbox.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 24, default: enums_1.OutboxStatus.PENDING }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'published_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoEventOutbox.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'retry_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoEventOutbox.prototype, "retry_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'last_error', nullable: true }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "last_error", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, name: 'request_id', nullable: true }),
    __metadata("design:type", String)
], ZunoEventOutbox.prototype, "request_id", void 0);
exports.ZunoEventOutbox = ZunoEventOutbox = __decorate([
    (0, typeorm_1.Entity)('zuno_event_outbox'),
    (0, typeorm_1.Index)('idx_zuno_outbox_dispatch', ['status', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_outbox_aggregate', ['aggregate_type', 'aggregate_id'])
], ZunoEventOutbox);
//# sourceMappingURL=zuno-event-outbox.entity.js.map