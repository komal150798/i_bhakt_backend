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
exports.ManifestSubcategory = void 0;
const typeorm_1 = require("typeorm");
const manifest_category_entity_1 = require("./manifest-category.entity");
const manifest_keyword_entity_1 = require("./manifest-keyword.entity");
const manifest_ritual_template_entity_1 = require("./manifest-ritual-template.entity");
const manifest_to_manifest_template_entity_1 = require("./manifest-to-manifest-template.entity");
const manifest_not_to_manifest_template_entity_1 = require("./manifest-not-to-manifest-template.entity");
const manifest_alignment_template_entity_1 = require("./manifest-alignment-template.entity");
let ManifestSubcategory = class ManifestSubcategory {
};
exports.ManifestSubcategory = ManifestSubcategory;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' }),
    __metadata("design:type", String)
], ManifestSubcategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'category_id' }),
    __metadata("design:type", String)
], ManifestSubcategory.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], ManifestSubcategory.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ManifestSubcategory.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ManifestSubcategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], ManifestSubcategory.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' }),
    __metadata("design:type", Date)
], ManifestSubcategory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()', name: 'updated_at' }),
    __metadata("design:type", Date)
], ManifestSubcategory.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => manifest_category_entity_1.ManifestCategory, (category) => category.subcategories, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", manifest_category_entity_1.ManifestCategory)
], ManifestSubcategory.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => manifest_keyword_entity_1.ManifestKeyword, (keyword) => keyword.subcategory),
    __metadata("design:type", Array)
], ManifestSubcategory.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => manifest_ritual_template_entity_1.ManifestRitualTemplate, (template) => template.subcategory),
    __metadata("design:type", Array)
], ManifestSubcategory.prototype, "ritual_templates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => manifest_to_manifest_template_entity_1.ManifestToManifestTemplate, (template) => template.subcategory),
    __metadata("design:type", Array)
], ManifestSubcategory.prototype, "to_manifest_templates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => manifest_not_to_manifest_template_entity_1.ManifestNotToManifestTemplate, (template) => template.subcategory),
    __metadata("design:type", Array)
], ManifestSubcategory.prototype, "not_to_manifest_templates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => manifest_alignment_template_entity_1.ManifestAlignmentTemplate, (template) => template.subcategory),
    __metadata("design:type", Array)
], ManifestSubcategory.prototype, "alignment_templates", void 0);
exports.ManifestSubcategory = ManifestSubcategory = __decorate([
    (0, typeorm_1.Entity)('manifest_subcategories'),
    (0, typeorm_1.Index)(['slug']),
    (0, typeorm_1.Index)(['category_id']),
    (0, typeorm_1.Index)(['is_active'])
], ManifestSubcategory);
//# sourceMappingURL=manifest-subcategory.entity.js.map