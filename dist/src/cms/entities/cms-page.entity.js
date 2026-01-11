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
exports.CMSPage = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const cms_page_type_enum_1 = require("../../common/enums/cms-page-type.enum");
let CMSPage = class CMSPage extends base_entity_1.BaseEntity {
};
exports.CMSPage = CMSPage;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], CMSPage.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CMSPage.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CMSPage.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CMSPage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: cms_page_type_enum_1.CMSPageType, default: cms_page_type_enum_1.CMSPageType.STATIC, name: 'page_type' }),
    __metadata("design:type", String)
], CMSPage.prototype, "page_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'meta_title' }),
    __metadata("design:type", String)
], CMSPage.prototype, "meta_title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'meta_description' }),
    __metadata("design:type", String)
], CMSPage.prototype, "meta_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'featured_image' }),
    __metadata("design:type", String)
], CMSPage.prototype, "featured_image", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_published' }),
    __metadata("design:type", Boolean)
], CMSPage.prototype, "is_published", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'published_at' }),
    __metadata("design:type", Date)
], CMSPage.prototype, "published_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'view_count' }),
    __metadata("design:type", Number)
], CMSPage.prototype, "view_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CMSPage.prototype, "metadata", void 0);
exports.CMSPage = CMSPage = __decorate([
    (0, typeorm_1.Entity)('cms_pages'),
    (0, typeorm_1.Index)(['slug', 'is_enabled', 'is_deleted']),
    (0, typeorm_1.Index)(['page_type', 'is_enabled'])
], CMSPage);
//# sourceMappingURL=cms-page.entity.js.map