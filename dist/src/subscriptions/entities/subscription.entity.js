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
exports.Subscription = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const plan_type_enum_1 = require("../../common/enums/plan-type.enum");
const order_entity_1 = require("../../orders/entities/order.entity");
const usage_tracking_entity_1 = require("./usage-tracking.entity");
let Subscription = class Subscription extends base_entity_1.BaseEntity {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], Subscription.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'plan_id' }),
    __metadata("design:type", Number)
], Subscription.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: plan_type_enum_1.PlanType, name: 'plan_type' }),
    __metadata("design:type", String)
], Subscription.prototype, "plan_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'start_date' }),
    __metadata("design:type", Date)
], Subscription.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'end_date' }),
    __metadata("design:type", Date)
], Subscription.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Subscription.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_renewal' }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "is_renewal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'order_id' }),
    __metadata("design:type", Number)
], Subscription.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'cancelled_at' }),
    __metadata("design:type", Date)
], Subscription.prototype, "cancelled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'cancellation_reason' }),
    __metadata("design:type", String)
], Subscription.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], Subscription.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id', referencedColumnName: 'id' }),
    __metadata("design:type", plan_entity_1.Plan)
], Subscription.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id', referencedColumnName: 'id' }),
    __metadata("design:type", order_entity_1.Order)
], Subscription.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => usage_tracking_entity_1.UsageTracking, (usage) => usage.subscription),
    __metadata("design:type", Array)
], Subscription.prototype, "usage_tracking", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)('subscriptions'),
    (0, typeorm_1.Index)(['user_id', 'is_active', 'is_deleted']),
    (0, typeorm_1.Index)(['plan_id', 'is_active'])
], Subscription);
//# sourceMappingURL=subscription.entity.js.map