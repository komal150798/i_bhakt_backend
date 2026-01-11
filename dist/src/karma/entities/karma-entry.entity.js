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
exports.KarmaEntry = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
const karma_type_enum_1 = require("../../common/enums/karma-type.enum");
let KarmaEntry = class KarmaEntry extends base_entity_1.BaseEntity {
};
exports.KarmaEntry = KarmaEntry;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], KarmaEntry.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], KarmaEntry.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: karma_type_enum_1.KarmaType, name: 'karma_type' }),
    __metadata("design:type", String)
], KarmaEntry.prototype, "karma_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'score' }),
    __metadata("design:type", Number)
], KarmaEntry.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'category_slug' }),
    __metadata("design:type", String)
], KarmaEntry.prototype, "category_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'category_name' }),
    __metadata("design:type", String)
], KarmaEntry.prototype, "category_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['good', 'bad', 'neutral'], nullable: true, name: 'self_assessment' }),
    __metadata("design:type", String)
], KarmaEntry.prototype, "self_assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'entry_date', default: () => 'CURRENT_DATE' }),
    __metadata("design:type", Date)
], KarmaEntry.prototype, "entry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaEntry.prototype, "ai_analysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], KarmaEntry.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", customer_entity_1.Customer)
], KarmaEntry.prototype, "customer", void 0);
exports.KarmaEntry = KarmaEntry = __decorate([
    (0, typeorm_1.Entity)('karma_entries'),
    (0, typeorm_1.Index)(['user_id', 'karma_type', 'is_deleted']),
    (0, typeorm_1.Index)(['user_id', 'entry_date'])
], KarmaEntry);
//# sourceMappingURL=karma-entry.entity.js.map