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
exports.AdminEmailCredentialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_credential_entity_1 = require("../../entities/email-credential.entity");
const create_email_credential_dto_1 = require("../../dto/create-email-credential.dto");
const jwt_auth_guard_1 = require("../../../guards/jwt-auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const user_role_enum_1 = require("../../../enums/user-role.enum");
const credential_service_1 = require("../../services/credential.service");
let AdminEmailCredentialController = class AdminEmailCredentialController {
    constructor(emailCredentialRepository, credentialService) {
        this.emailCredentialRepository = emailCredentialRepository;
        this.credentialService = credentialService;
    }
    async getAll() {
        const credentials = await this.emailCredentialRepository.find({
            where: { is_deleted: false },
            order: { is_active: 'DESC', added_date: 'DESC' },
        });
        return {
            success: true,
            data: credentials,
        };
    }
    async getOne(id) {
        const credential = await this.emailCredentialRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!credential) {
            return {
                success: false,
                message: 'Email credential not found',
            };
        }
        return {
            success: true,
            data: credential,
        };
    }
    async create(dto, req) {
        if (dto.is_active) {
            await this.credentialService.deactivateAllEmailCredentials();
        }
        const credential = this.emailCredentialRepository.create({
            ...dto,
            created_by: req.user?.id || null,
            updated_by: req.user?.id || null,
        });
        const saved = await this.emailCredentialRepository.save(credential);
        if (dto.is_active) {
            await this.credentialService.activateEmailCredential(saved.id);
        }
        return {
            success: true,
            data: saved,
        };
    }
    async update(id, dto, req) {
        const credential = await this.emailCredentialRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!credential) {
            return {
                success: false,
                message: 'Email credential not found',
            };
        }
        if (dto.is_active && !credential.is_active) {
            await this.credentialService.deactivateAllEmailCredentials();
        }
        Object.assign(credential, dto);
        credential.updated_by = req.user?.id || null;
        const saved = await this.emailCredentialRepository.save(credential);
        if (dto.is_active) {
            await this.credentialService.activateEmailCredential(saved.id);
        }
        return {
            success: true,
            data: saved,
        };
    }
    async delete(id) {
        const credential = await this.emailCredentialRepository.findOne({
            where: { id, is_deleted: false },
        });
        if (!credential) {
            return {
                success: false,
                message: 'Email credential not found',
            };
        }
        credential.is_deleted = true;
        await this.emailCredentialRepository.save(credential);
        return {
            success: true,
            message: 'Email credential deleted',
        };
    }
    async activate(id) {
        await this.credentialService.activateEmailCredential(id);
        return {
            success: true,
            message: 'Email credential activated',
        };
    }
};
exports.AdminEmailCredentialController = AdminEmailCredentialController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Email credentials' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email credentials retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Email credential by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email credential retrieved' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create Email credential' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Email credential created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_email_credential_dto_1.CreateEmailCredentialDto, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update Email credential' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email credential updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete Email credential (soft delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email credential deleted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Activate Email credential' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email credential activated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminEmailCredentialController.prototype, "activate", null);
exports.AdminEmailCredentialController = AdminEmailCredentialController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Email Credentials'),
    (0, common_1.Controller)('admin/messaging/email-credentials'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_credential_entity_1.EmailCredential)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        credential_service_1.CredentialService])
], AdminEmailCredentialController);
//# sourceMappingURL=email-credential.controller.js.map