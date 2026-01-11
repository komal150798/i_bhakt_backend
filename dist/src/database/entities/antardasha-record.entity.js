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
exports.AntardashaRecord = void 0;
const typeorm_1 = require("typeorm");
const dasha_record_entity_1 = require("./dasha-record.entity");
const pratyantar_dasha_record_entity_1 = require("./pratyantar-dasha-record.entity");
let AntardashaRecord = class AntardashaRecord {
};
exports.AntardashaRecord = AntardashaRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AntardashaRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], AntardashaRecord.prototype, "dasha_record_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dasha_record_entity_1.DashaRecord, (dasha) => dasha.antardashas, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'dasha_record_id' }),
    __metadata("design:type", dasha_record_entity_1.DashaRecord)
], AntardashaRecord.prototype, "dasha_record", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], AntardashaRecord.prototype, "antardasha_lord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], AntardashaRecord.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], AntardashaRecord.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false }),
    __metadata("design:type", Number)
], AntardashaRecord.prototype, "duration_years", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AntardashaRecord.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pratyantar_dasha_record_entity_1.PratyantarDashaRecord, (pratyantar) => pratyantar.antardasha_record, { cascade: true }),
    __metadata("design:type", Array)
], AntardashaRecord.prototype, "pratyantardashas", void 0);
exports.AntardashaRecord = AntardashaRecord = __decorate([
    (0, typeorm_1.Entity)('antardasha_records')
], AntardashaRecord);
//# sourceMappingURL=antardasha-record.entity.js.map