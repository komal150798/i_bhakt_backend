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
exports.ManifestationLog = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const customer_entity_1 = require("../../users/entities/customer.entity");
let ManifestationLog = class ManifestationLog extends base_entity_1.BaseEntity {
};
exports.ManifestationLog = ManifestationLog;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], ManifestationLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ManifestationLog.prototype, "desire_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'emotional_coherence' }),
    __metadata("design:type", Number)
], ManifestationLog.prototype, "emotional_coherence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'linguistic_clarity' }),
    __metadata("design:type", Number)
], ManifestationLog.prototype, "linguistic_clarity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'astrological_resonance' }),
    __metadata("design:type", Number)
], ManifestationLog.prototype, "astrological_resonance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'manifestation_probability' }),
    __metadata("design:type", Number)
], ManifestationLog.prototype, "manifestation_probability", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true, name: 'best_manifestation_date' }),
    __metadata("design:type", Date)
], ManifestationLog.prototype, "best_manifestation_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'analysis_data' }),
    __metadata("design:type", Object)
], ManifestationLog.prototype, "analysis_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ManifestationLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", customer_entity_1.Customer)
], ManifestationLog.prototype, "customer", void 0);
exports.ManifestationLog = ManifestationLog = __decorate([
    (0, typeorm_1.Entity)('manifestation_logs'),
    (0, typeorm_1.Index)(['user_id', 'is_deleted'])
], ManifestationLog);
//# sourceMappingURL=manifestation-log.entity.js.map