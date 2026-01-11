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
exports.AdminEmailTemplateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_template_entity_1 = require("../../entities/email-template.entity");
const create_email_template_dto_1 = require("../../dto/create-email-template.dto");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const user_role_enum_1 = require("../../../enums/user-role.enum");
let AdminEmailTemplateController = class AdminEmailTemplateController {
    constructor(emailTemplateRepository) {
        this.emailTemplateRepository = emailTemplateRepository;
    }
    async getAll() {
        const templates = await this.emailTemplateRepository.find({
            where: { is_deleted: false },
            order: { template_code: 'ASC' },
        });
        return {
            success: true,
            data: templates,
        };
    }
    async getOne(id) {
        const template = await this.emailTemplateRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!template) {
            return {
                success: false,
                message: 'Email template not found',
            };
        }
        return {
            success: true,
            data: template,
        };
    }
    async getByCode(code) {
        const template = await this.emailTemplateRepository.findOne({
            where: { template_code: code, is_deleted: false },
        });
        if (!template) {
            return {
                success: false,
                message: 'Email template not found',
            };
        }
        return {
            success: true,
            data: template,
        };
    }
    async create(dto, req) {
        const existing = await this.emailTemplateRepository.findOne({
            where: { template_code: dto.template_code, is_deleted: false },
        });
        if (existing) {
            return {
                success: false,
                message: 'Template code already exists',
            };
        }
        const template = this.emailTemplateRepository.create({
            ...dto,
            created_by: req.user?.id || null,
            updated_by: req.user?.id || null,
        });
        const saved = await this.emailTemplateRepository.save(template);
        return {
            success: true,
            data: saved,
        };
    }
    async update(id, dto, req) {
        const template = await this.emailTemplateRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!template) {
            return {
                success: false,
                message: 'Email template not found',
            };
        }
        if (dto.template_code && dto.template_code !== template.template_code) {
            const existing = await this.emailTemplateRepository.findOne({
                where: { template_code: dto.template_code, is_deleted: false },
            });
            if (existing) {
                return {
                    success: false,
                    message: 'Template code already exists',
                };
            }
        }
        Object.assign(template, dto);
        template.updated_by = req.user?.id || null;
        const saved = await this.emailTemplateRepository.save(template);
        return {
            success: true,
            data: saved,
        };
    }
    async delete(id) {
        const template = await this.emailTemplateRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!template) {
            return {
                success: false,
                message: 'Email template not found',
            };
        }
        template.is_deleted = true;
        await this.emailTemplateRepository.save(template);
        return {
            success: true,
            message: 'Email template deleted',
        };
    }
};
exports.AdminEmailTemplateController = AdminEmailTemplateController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Email templates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email templates retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Email template by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email template retrieved' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Email template by code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email template retrieved' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "getByCode", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create Email template' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Email template created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_email_template_dto_1.CreateEmailTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update Email template' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email template updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete Email template (soft delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email template deleted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEmailTemplateController.prototype, "delete", null);
exports.AdminEmailTemplateController = AdminEmailTemplateController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Email Templates'),
    (0, common_1.Controller)('admin/messaging/email-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdminEmailTemplateController);
//# sourceMappingURL=email-template.controller.js.map