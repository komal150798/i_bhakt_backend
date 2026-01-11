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
exports.SukshmaDashaRecord = void 0;
const typeorm_1 = require("typeorm");
const pratyantar_dasha_record_entity_1 = require("./pratyantar-dasha-record.entity");
let SukshmaDashaRecord = class SukshmaDashaRecord {
};
exports.SukshmaDashaRecord = SukshmaDashaRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SukshmaDashaRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], SukshmaDashaRecord.prototype, "pratyantar_dasha_record_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pratyantar_dasha_record_entity_1.PratyantarDashaRecord, (pratyantar) => pratyantar.sukshmadashas, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pratyantar_dasha_record_id' }),
    __metadata("design:type", pratyantar_dasha_record_entity_1.PratyantarDashaRecord)
], SukshmaDashaRecord.prototype, "pratyantar_dasha_record", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], SukshmaDashaRecord.prototype, "sukshma_lord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], SukshmaDashaRecord.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], SukshmaDashaRecord.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false }),
    __metadata("design:type", Number)
], SukshmaDashaRecord.prototype, "duration_years", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SukshmaDashaRecord.prototype, "created_at", void 0);
exports.SukshmaDashaRecord = SukshmaDashaRecord = __decorate([
    (0, typeorm_1.Entity)('sukshma_dasha_records')
], SukshmaDashaRecord);
//# sourceMappingURL=sukshma-dasha-record.entity.js.map