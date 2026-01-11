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
exports.ManifestAlignmentTemplate = void 0;
const typeorm_1 = require("typeorm");
const manifest_category_entity_1 = require("./manifest-category.entity");
const manifest_subcategory_entity_1 = require("./manifest-subcategory.entity");
let ManifestAlignmentTemplate = class ManifestAlignmentTemplate {
};
exports.ManifestAlignmentTemplate = ManifestAlignmentTemplate;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' }),
    __metadata("design:type", String)
], ManifestAlignmentTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'category_id' }),
    __metadata("design:type", String)
], ManifestAlignmentTemplate.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'subcategory_id' }),
    __metadata("design:type", String)
], ManifestAlignmentTemplate.prototype, "subcategory_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'template_text' }),
    __metadata("design:type", String)
], ManifestAlignmentTemplate.prototype, "template_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], ManifestAlignmentTemplate.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], ManifestAlignmentTemplate.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' }),
    __metadata("design:type", Date)
], ManifestAlignmentTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => manifest_category_entity_1.ManifestCategory, (category) => category.alignment_templates, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", manifest_category_entity_1.ManifestCategory)
], ManifestAlignmentTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => manifest_subcategory_entity_1.ManifestSubcategory, (subcategory) => subcategory.alignment_templates, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'subcategory_id' }),
    __metadata("design:type", manifest_subcategory_entity_1.ManifestSubcategory)
], ManifestAlignmentTemplate.prototype, "subcategory", void 0);
exports.ManifestAlignmentTemplate = ManifestAlignmentTemplate = __decorate([
    (0, typeorm_1.Entity)('manifest_alignment_templates'),
    (0, typeorm_1.Index)(['category_id']),
    (0, typeorm_1.Index)(['subcategory_id']),
    (0, typeorm_1.Index)(['is_active']),
    (0, typeorm_1.Index)(['priority'])
], ManifestAlignmentTemplate);
//# sourceMappingURL=manifest-alignment-template.entity.js.map