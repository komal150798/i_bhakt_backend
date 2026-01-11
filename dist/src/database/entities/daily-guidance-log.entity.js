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
exports.DailyGuidanceLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const guidance_template_entity_1 = require("./guidance-template.entity");
let DailyGuidanceLog = class DailyGuidanceLog {
};
exports.DailyGuidanceLog = DailyGuidanceLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DailyGuidanceLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], DailyGuidanceLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.guidance_logs, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DailyGuidanceLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DailyGuidanceLog.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => guidance_template_entity_1.GuidanceTemplate, (template) => template.guidance_logs, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'template_id' }),
    __metadata("design:type", guidance_template_entity_1.GuidanceTemplate)
], DailyGuidanceLog.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: false }),
    __metadata("design:type", Date)
], DailyGuidanceLog.prototype, "guidance_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false, default: 'app' }),
    __metadata("design:type", String)
], DailyGuidanceLog.prototype, "delivery_channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], DailyGuidanceLog.prototype, "delivered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DailyGuidanceLog.prototype, "notes", void 0);
exports.DailyGuidanceLog = DailyGuidanceLog = __decorate([
    (0, typeorm_1.Entity)('daily_guidance_logs'),
    (0, typeorm_1.Unique)(['user_id', 'guidance_date'])
], DailyGuidanceLog);
//# sourceMappingURL=daily-guidance-log.entity.js.map