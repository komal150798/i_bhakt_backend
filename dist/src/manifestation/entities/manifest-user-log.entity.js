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
exports.ManifestUserLog = void 0;
const typeorm_1 = require("typeorm");
let ManifestUserLog = class ManifestUserLog {
};
exports.ManifestUserLog = ManifestUserLog;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'manifestation_title' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "manifestation_title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'manifestation_text' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "manifestation_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'detected_category' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "detected_category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'detected_subcategory' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "detected_subcategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'energy_state' }),
    __metadata("design:type", String)
], ManifestUserLog.prototype, "energy_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'ai_output_json' }),
    __metadata("design:type", Object)
], ManifestUserLog.prototype, "ai_output_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' }),
    __metadata("design:type", Date)
], ManifestUserLog.prototype, "created_at", void 0);
exports.ManifestUserLog = ManifestUserLog = __decorate([
    (0, typeorm_1.Entity)('manifest_user_logs'),
    (0, typeorm_1.Index)(['user_id']),
    (0, typeorm_1.Index)(['detected_category']),
    (0, typeorm_1.Index)(['created_at'])
], ManifestUserLog);
//# sourceMappingURL=manifest-user-log.entity.js.map