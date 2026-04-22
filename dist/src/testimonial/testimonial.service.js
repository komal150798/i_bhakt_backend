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
var TestimonialService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const testimonial_entity_1 = require("./entities/testimonial.entity");
let TestimonialService = TestimonialService_1 = class TestimonialService {
    constructor(testimonialRepository) {
        this.testimonialRepository = testimonialRepository;
        this.logger = new common_1.Logger(TestimonialService_1.name);
    }
    async findAll(category) {
        const where = { is_deleted: false, is_enabled: true };
        if (category) {
            where.category = category;
        }
        return this.testimonialRepository.find({
            where,
            order: { is_featured: 'DESC', display_order: 'ASC', added_date: 'DESC' },
        });
    }
    async findFeatured() {
        return this.testimonialRepository.find({
            where: { is_deleted: false, is_enabled: true, is_featured: true },
            order: { display_order: 'ASC', added_date: 'DESC' },
            take: 6,
        });
    }
    async create(dto) {
        const testimonial = this.testimonialRepository.create({
            name: dto.name,
            avatar_url: dto.avatar_url?.trim() || null,
            location: dto.location?.trim() || null,
            message: dto.message,
            rating: dto.rating,
            category: dto.category,
            is_featured: dto.is_featured || false,
            display_order: dto.display_order ?? 0,
            is_enabled: dto.is_enabled !== undefined ? dto.is_enabled : true,
        });
        const saved = await this.testimonialRepository.save(testimonial);
        this.logger.log(`Testimonial created: ${saved.id} by ${dto.name}`);
        return saved;
    }
    async findAllForAdmin() {
        return this.testimonialRepository.find({
            where: { is_deleted: false },
            order: { is_featured: 'DESC', display_order: 'ASC', added_date: 'DESC' },
        });
    }
    async update(id, dto) {
        const existing = await this.testimonialRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Testimonial ${id} not found`);
        }
        const patch = { ...dto };
        if (dto.avatar_url !== undefined) {
            patch.avatar_url = dto.avatar_url?.trim() || null;
        }
        if (dto.location !== undefined) {
            patch.location = dto.location?.trim() || null;
        }
        const merged = this.testimonialRepository.merge(existing, patch);
        return this.testimonialRepository.save(merged);
    }
    async softDelete(id) {
        const existing = await this.testimonialRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Testimonial ${id} not found`);
        }
        existing.is_deleted = true;
        await this.testimonialRepository.save(existing);
        this.logger.log(`Testimonial soft-deleted: ${id}`);
    }
};
exports.TestimonialService = TestimonialService;
exports.TestimonialService = TestimonialService = TestimonialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(testimonial_entity_1.Testimonial)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TestimonialService);
//# sourceMappingURL=testimonial.service.js.map