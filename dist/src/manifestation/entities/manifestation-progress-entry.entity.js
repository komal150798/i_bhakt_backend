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
exports.ManifestationProgressEntry = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const manifestation_entity_1 = require("./manifestation.entity");
let ManifestationProgressEntry = class ManifestationProgressEntry extends base_entity_1.BaseEntity {
};
exports.ManifestationProgressEntry = ManifestationProgressEntry;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'manifestation_id' }),
    __metadata("design:type", Number)
], ManifestationProgressEntry.prototype, "manifestation_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], ManifestationProgressEntry.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'entry_date' }),
    __metadata("design:type", Date)
], ManifestationProgressEntry.prototype, "entry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'action_text' }),
    __metadata("design:type", String)
], ManifestationProgressEntry.prototype, "action_text", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => manifestation_entity_1.Manifestation, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'manifestation_id', referencedColumnName: 'id' }),
    __metadata("design:type", manifestation_entity_1.Manifestation)
], ManifestationProgressEntry.prototype, "manifestation", void 0);
exports.ManifestationProgressEntry = ManifestationProgressEntry = __decorate([
    (0, typeorm_1.Entity)('manifestation_progress_entries'),
    (0, typeorm_1.Index)(['manifestation_id', 'entry_date', 'is_deleted'], { unique: true }),
    (0, typeorm_1.Index)(['manifestation_id', 'is_deleted']),
    (0, typeorm_1.Index)(['user_id', 'is_deleted'])
], ManifestationProgressEntry);
//# sourceMappingURL=manifestation-progress-entry.entity.js.map