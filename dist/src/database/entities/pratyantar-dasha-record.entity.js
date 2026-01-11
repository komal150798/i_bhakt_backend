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
exports.PratyantarDashaRecord = void 0;
const typeorm_1 = require("typeorm");
const antardasha_record_entity_1 = require("./antardasha-record.entity");
const sukshma_dasha_record_entity_1 = require("./sukshma-dasha-record.entity");
let PratyantarDashaRecord = class PratyantarDashaRecord {
};
exports.PratyantarDashaRecord = PratyantarDashaRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PratyantarDashaRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], PratyantarDashaRecord.prototype, "antardasha_record_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => antardasha_record_entity_1.AntardashaRecord, (antara) => antara.pratyantardashas, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'antardasha_record_id' }),
    __metadata("design:type", antardasha_record_entity_1.AntardashaRecord)
], PratyantarDashaRecord.prototype, "antardasha_record", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], PratyantarDashaRecord.prototype, "pratyantar_lord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], PratyantarDashaRecord.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], PratyantarDashaRecord.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false }),
    __metadata("design:type", Number)
], PratyantarDashaRecord.prototype, "duration_years", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PratyantarDashaRecord.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sukshma_dasha_record_entity_1.SukshmaDashaRecord, (sukshma) => sukshma.pratyantar_dasha_record, { cascade: true }),
    __metadata("design:type", Array)
], PratyantarDashaRecord.prototype, "sukshmadashas", void 0);
exports.PratyantarDashaRecord = PratyantarDashaRecord = __decorate([
    (0, typeorm_1.Entity)('pratyantar_dasha_records')
], PratyantarDashaRecord);
//# sourceMappingURL=pratyantar-dasha-record.entity.js.map