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
exports.TestimonialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const testimonial_service_1 = require("./testimonial.service");
const create_testimonial_dto_1 = require("./dto/create-testimonial.dto");
const update_testimonial_dto_1 = require("./dto/update-testimonial.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let TestimonialController = class TestimonialController {
    constructor(testimonialService) {
        this.testimonialService = testimonialService;
    }
    async getFeatured() {
        const testimonials = await this.testimonialService.findFeatured();
        return { success: true, data: testimonials };
    }
    async getAll(category) {
        const testimonials = await this.testimonialService.findAll(category);
        return { success: true, data: testimonials };
    }
    async adminList() {
        const testimonials = await this.testimonialService.findAllForAdmin();
        return { success: true, data: testimonials };
    }
    async create(dto) {
        const testimonial = await this.testimonialService.create(dto);
        return { success: true, data: testimonial };
    }
    async update(id, dto) {
        const testimonial = await this.testimonialService.update(id, dto);
        return { success: true, data: testimonial };
    }
    async remove(id) {
        await this.testimonialService.softDelete(id);
        return { success: true, data: { id } };
    }
};
exports.TestimonialController = TestimonialController;
__decorate([
    (0, common_1.Get)('home/testimonials'),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured testimonials (Public)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of featured testimonials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "getFeatured", null);
__decorate([
    (0, common_1.Get)('home/testimonials/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all testimonials (Public)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of testimonials' }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('admin/testimonials'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'List testimonials for admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of testimonials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "adminList", null);
__decorate([
    (0, common_1.Post)('admin/testimonials'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a testimonial (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Testimonial created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_testimonial_dto_1.CreateTestimonialDto]),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('admin/testimonials/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a testimonial (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Testimonial updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_testimonial_dto_1.UpdateTestimonialDto]),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('admin/testimonials/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a testimonial (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Testimonial deleted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TestimonialController.prototype, "remove", null);
exports.TestimonialController = TestimonialController = __decorate([
    (0, swagger_1.ApiTags)('Testimonials'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [testimonial_service_1.TestimonialService])
], TestimonialController);
//# sourceMappingURL=testimonial.controller.js.map