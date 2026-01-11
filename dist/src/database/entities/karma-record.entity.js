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
exports.KarmaRecord = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const karma_category_entity_1 = require("./karma-category.entity");
let KarmaRecord = class KarmaRecord {
};
exports.KarmaRecord = KarmaRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], KarmaRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], KarmaRecord.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.karma_records, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], KarmaRecord.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], KarmaRecord.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => karma_category_entity_1.KarmaCategory, (category) => category.karma_records, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", karma_category_entity_1.KarmaCategory)
], KarmaRecord.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false, default: 'text' }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "input_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "media_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "sentiment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], KarmaRecord.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false, default: 0.0 }),
    __metadata("design:type", Number)
], KarmaRecord.prototype, "score_delta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false, default: 'recorded' }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], KarmaRecord.prototype, "recorded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'extra_metadata' }),
    __metadata("design:type", String)
], KarmaRecord.prototype, "extra_metadata", void 0);
exports.KarmaRecord = KarmaRecord = __decorate([
    (0, typeorm_1.Entity)('karma_records')
], KarmaRecord);
//# sourceMappingURL=karma-record.entity.js.map