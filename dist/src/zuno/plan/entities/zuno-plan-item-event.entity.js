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
exports.ZunoPlanItemEvent = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const plan_enum_1 = require("../enums/plan.enum");
let ZunoPlanItemEvent = class ZunoPlanItemEvent extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoPlanItemEvent = ZunoPlanItemEvent;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_item_id' }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "plan_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_id' }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'event_type' }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'old_status', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "old_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'new_status', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "new_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: plan_enum_1.PlanItemEventSource.SYSTEM }),
    __metadata("design:type", String)
], ZunoPlanItemEvent.prototype, "source", void 0);
exports.ZunoPlanItemEvent = ZunoPlanItemEvent = __decorate([
    (0, typeorm_1.Entity)('zuno_plan_item_events'),
    (0, typeorm_1.Index)('idx_zuno_plan_item_events_item', ['plan_item_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_plan_item_events_plan', ['plan_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_plan_item_events_user', ['user_id', 'event_type'])
], ZunoPlanItemEvent);
//# sourceMappingURL=zuno-plan-item-event.entity.js.map