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
exports.UsageTracking = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const subscription_entity_1 = require("./subscription.entity");
let UsageTracking = class UsageTracking extends base_entity_1.BaseEntity {
};
exports.UsageTracking = UsageTracking;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], UsageTracking.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'subscription_id' }),
    __metadata("design:type", Number)
], UsageTracking.prototype, "subscription_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'module_slug' }),
    __metadata("design:type", String)
], UsageTracking.prototype, "module_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'action_type' }),
    __metadata("design:type", String)
], UsageTracking.prototype, "action_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'usage_count' }),
    __metadata("design:type", Number)
], UsageTracking.prototype, "usage_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'limit' }),
    __metadata("design:type", Number)
], UsageTracking.prototype, "limit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period' }),
    __metadata("design:type", Date)
], UsageTracking.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UsageTracking.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], UsageTracking.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_entity_1.Subscription, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id', referencedColumnName: 'id' }),
    __metadata("design:type", subscription_entity_1.Subscription)
], UsageTracking.prototype, "subscription", void 0);
exports.UsageTracking = UsageTracking = __decorate([
    (0, typeorm_1.Entity)('usage_tracking'),
    (0, typeorm_1.Index)(['user_id', 'module_slug', 'period']),
    (0, typeorm_1.Index)(['subscription_id', 'period'])
], UsageTracking);
//# sourceMappingURL=usage-tracking.entity.js.map