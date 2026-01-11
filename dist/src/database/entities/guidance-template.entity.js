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
exports.GuidanceTemplate = void 0;
const typeorm_1 = require("typeorm");
const daily_guidance_log_entity_1 = require("./daily-guidance-log.entity");
let GuidanceTemplate = class GuidanceTemplate {
};
exports.GuidanceTemplate = GuidanceTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GuidanceTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], GuidanceTemplate.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], GuidanceTemplate.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GuidanceTemplate.prototype, "min_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GuidanceTemplate.prototype, "max_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false, default: 'free' }),
    __metadata("design:type", String)
], GuidanceTemplate.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], GuidanceTemplate.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GuidanceTemplate.prototype, "score_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], GuidanceTemplate.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GuidanceTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GuidanceTemplate.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_guidance_log_entity_1.DailyGuidanceLog, (log) => log.template),
    __metadata("design:type", Array)
], GuidanceTemplate.prototype, "guidance_logs", void 0);
exports.GuidanceTemplate = GuidanceTemplate = __decorate([
    (0, typeorm_1.Entity)('guidance_templates')
], GuidanceTemplate);
//# sourceMappingURL=guidance-template.entity.js.map