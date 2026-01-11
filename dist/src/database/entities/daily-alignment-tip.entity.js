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
exports.DailyAlignmentTip = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let DailyAlignmentTip = class DailyAlignmentTip {
};
exports.DailyAlignmentTip = DailyAlignmentTip;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DailyAlignmentTip.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], DailyAlignmentTip.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.alignment_tips, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DailyAlignmentTip.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], DailyAlignmentTip.prototype, "tip_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DailyAlignmentTip.prototype, "manifestation_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false, default: 'manifestation' }),
    __metadata("design:type", String)
], DailyAlignmentTip.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false, default: 'active' }),
    __metadata("design:type", String)
], DailyAlignmentTip.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], DailyAlignmentTip.prototype, "last_added_to_journal_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false, default: 'daily' }),
    __metadata("design:type", String)
], DailyAlignmentTip.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DailyAlignmentTip.prototype, "scheduled_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], DailyAlignmentTip.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], DailyAlignmentTip.prototype, "last_generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false, default: 3 }),
    __metadata("design:type", Number)
], DailyAlignmentTip.prototype, "auto_archive_after_days", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DailyAlignmentTip.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DailyAlignmentTip.prototype, "updated_at", void 0);
exports.DailyAlignmentTip = DailyAlignmentTip = __decorate([
    (0, typeorm_1.Entity)('daily_alignment_tips'),
    (0, typeorm_1.Unique)(['user_id', 'tip_text'])
], DailyAlignmentTip);
//# sourceMappingURL=daily-alignment-tip.entity.js.map