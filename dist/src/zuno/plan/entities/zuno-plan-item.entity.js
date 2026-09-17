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
exports.ZunoPlanItem = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const plan_enum_1 = require("../enums/plan.enum");
const zuno_plan_entity_1 = require("./zuno-plan.entity");
let ZunoPlanItem = class ZunoPlanItem extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoPlanItem = ZunoPlanItem;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_id' }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'parent_item_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "parent_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300 }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'why_this_matters', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "why_this_matters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: plan_enum_1.PlanItemCategory.OTHER }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: plan_enum_1.PlanItemPriority.IMPORTANT }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'priority_rank', default: 2 }),
    __metadata("design:type", Number)
], ZunoPlanItem.prototype, "priority_rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_practice', default: false }),
    __metadata("design:type", Boolean)
], ZunoPlanItem.prototype, "is_practice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: plan_enum_1.PlanItemStatus.PENDING }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'scheduled_date', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "scheduled_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'due_at', nullable: true }),
    __metadata("design:type", Object)
], ZunoPlanItem.prototype, "due_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, name: 'due_source', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "due_source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'estimated_minutes', nullable: true }),
    __metadata("design:type", Number)
], ZunoPlanItem.prototype, "estimated_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, name: 'source_type' }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "source_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_ref_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "source_ref_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'mka_item_id', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "mka_item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'scenario_scope',
        default: plan_enum_1.PlanItemScenarioScope.SHARED_ACROSS_SCENARIOS,
    }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "scenario_scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'scenario_refs', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], ZunoPlanItem.prototype, "scenario_refs", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'trigger_condition',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "trigger_condition", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'depends_on_item_ids',
        default: () => "'[]'::jsonb",
    }),
    __metadata("design:type", Array)
], ZunoPlanItem.prototype, "depends_on_item_ids", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'karma_eligible', default: false }),
    __metadata("design:type", Boolean)
], ZunoPlanItem.prototype, "karma_eligible", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'realignment_policy',
        default: plan_enum_1.PlanItemRealignmentPolicy.PRESERVE_IF_RELEVANT,
    }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "realignment_policy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_hypothetical', default: false }),
    __metadata("design:type", Boolean)
], ZunoPlanItem.prototype, "is_hypothetical", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'display_order', default: 0 }),
    __metadata("design:type", Number)
], ZunoPlanItem.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'started_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoPlanItem.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ZunoPlanItem.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'deferred_to', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "deferred_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'blocked_reason', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "blocked_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'deferral_count', default: 0 }),
    __metadata("design:type", Number)
], ZunoPlanItem.prototype, "deferral_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'user_note', nullable: true }),
    __metadata("design:type", String)
], ZunoPlanItem.prototype, "user_note", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_plan_entity_1.ZunoPlan, (plan) => plan.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", zuno_plan_entity_1.ZunoPlan)
], ZunoPlanItem.prototype, "plan", void 0);
exports.ZunoPlanItem = ZunoPlanItem = __decorate([
    (0, typeorm_1.Entity)('zuno_plan_items'),
    (0, typeorm_1.Index)('idx_zuno_plan_items_plan', ['plan_id', 'display_order']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_user_status', ['user_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_plan_status', ['plan_id', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_scheduled', ['user_id', 'scheduled_date', 'status']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_due', ['user_id', 'due_at']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_mka', ['mka_item_id']),
    (0, typeorm_1.Index)('idx_zuno_plan_items_parent', ['parent_item_id'])
], ZunoPlanItem);
//# sourceMappingURL=zuno-plan-item.entity.js.map