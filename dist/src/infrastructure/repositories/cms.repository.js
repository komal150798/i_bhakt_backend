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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMSRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cms_page_entity_1 = require("../../cms/entities/cms-page.entity");
let CMSRepository = class CMSRepository {
    constructor(cmsRepository) {
        this.cmsRepository = cmsRepository;
    }
    async findById(id) {
        return this.cmsRepository.findOne({ where: { id, is_deleted: false } });
    }
    async findByUniqueId(uniqueId) {
        return this.cmsRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
        });
    }
    async findBySlug(slug) {
        return this.cmsRepository.findOne({
            where: { slug, is_deleted: false },
        });
    }
    async findByPageType(pageType, options) {
        const where = { page_type: pageType, is_deleted: false };
        if (options?.is_published !== undefined) {
            where.is_published = options.is_published;
        }
        return this.cmsRepository.find({ where, order: { added_date: 'DESC' } });
    }
    async findAll(options) {
        const where = { is_deleted: options?.is_deleted ?? false };
        if (options?.is_published !== undefined) {
            where.is_published = options.is_published;
        }
        return this.cmsRepository.find({ where, order: { added_date: 'DESC' } });
    }
    async create(data) {
        const cmsPage = this.cmsRepository.create(data);
        return this.cmsRepository.save(cmsPage);
    }
    async update(cmsPage, data) {
        Object.assign(cmsPage, data);
        cmsPage.modify_by = data.modify_by;
        return this.cmsRepository.save(cmsPage);
    }
    async delete(cmsPage, userId) {
        cmsPage.is_deleted = true;
        cmsPage.modify_by = userId;
        await this.cmsRepository.save(cmsPage);
    }
};
exports.CMSRepository = CMSRepository;
exports.CMSRepository = CMSRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cms_page_entity_1.CMSPage)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CMSRepository);
//# sourceMappingURL=cms.repository.js.map