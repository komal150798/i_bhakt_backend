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
exports.AdminAIPromptController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const prompt_service_1 = require("../prompt.service");
const create_ai_prompt_dto_1 = require("../dtos/create-ai-prompt.dto");
const update_ai_prompt_dto_1 = require("../dtos/update-ai-prompt.dto");
let AdminAIPromptController = class AdminAIPromptController {
    constructor(promptService) {
        this.promptService = promptService;
    }
    async listPrompts(scope, type, language, is_active) {
        const isActiveBool = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
        const prompts = await this.promptService.getAllPrompts({
            scope,
            type,
            language,
            is_active: isActiveBool,
        });
        return {
            success: true,
            data: prompts,
            count: prompts.length,
        };
    }
    async getPrompt(id) {
        const prompt = await this.promptService.getPromptById(id);
        if (!prompt) {
            throw new Error(`Prompt not found: ${id}`);
        }
        return {
            success: true,
            data: prompt,
        };
    }
    async createPrompt(createDto, user) {
        try {
            await this.promptService.getPrompt(createDto.key);
            throw new Error(`Prompt with key '${createDto.key}' already exists`);
        }
        catch (error) {
            if (!error.message.includes('not found')) {
                throw error;
            }
        }
        const prompt = await this.promptService.createPrompt({
            ...createDto,
            language: createDto.language || 'en',
            is_active: createDto.is_active !== undefined ? createDto.is_active : true,
            version: 1,
            updated_by: user.id,
        });
        return {
            success: true,
            message: 'Prompt created successfully',
            data: prompt,
        };
    }
    async updatePrompt(id, updateDto, user) {
        const prompt = await this.promptService.updatePrompt(id, {
            ...updateDto,
            updated_by: user.id,
        });
        return {
            success: true,
            message: 'Prompt updated successfully. Cache cleared.',
            data: prompt,
        };
    }
    async deletePrompt(id) {
        await this.promptService.deletePrompt(id);
        return {
            success: true,
            message: 'Prompt deleted successfully. Cache cleared.',
        };
    }
    async clearCache(id) {
        const prompt = await this.promptService.getPromptById(id);
        if (!prompt) {
            throw new Error(`Prompt not found: ${id}`);
        }
        await this.promptService.clearPromptCacheByKey(prompt.key);
        return {
            success: true,
            message: `Cache cleared for prompt: ${prompt.key}`,
        };
    }
    async clearAllCache() {
        await this.promptService.clearAllPromptCache();
        return {
            success: true,
            message: 'All prompt caches cleared successfully',
        };
    }
};
exports.AdminAIPromptController = AdminAIPromptController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List all AI prompts (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prompts retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'scope', required: false, description: 'Filter by scope' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by type' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, description: 'Filter by language' }),
    (0, swagger_1.ApiQuery)({ name: 'is_active', required: false, description: 'Filter by active status' }),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('language')),
    __param(3, (0, common_1.Query)('is_active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "listPrompts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI prompt by ID (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prompt retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Prompt not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "getPrompt", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new AI prompt (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Prompt created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Prompt key already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ai_prompt_dto_1.CreateAIPromptDto, Object]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "createPrompt", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update an AI prompt (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prompt updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Prompt not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ai_prompt_dto_1.UpdateAIPromptDto, Object]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "updatePrompt", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an AI prompt (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prompt deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Prompt not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "deletePrompt", null);
__decorate([
    (0, common_1.Post)(':id/clear-cache'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Clear cache for a specific prompt (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cache cleared successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "clearCache", null);
__decorate([
    (0, common_1.Post)('clear-all-cache'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all prompt caches (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All caches cleared successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAIPromptController.prototype, "clearAllCache", null);
exports.AdminAIPromptController = AdminAIPromptController = __decorate([
    (0, swagger_1.ApiTags)('Admin - AI Prompts'),
    (0, common_1.Controller)('admin/ai-prompts'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [prompt_service_1.PromptService])
], AdminAIPromptController);
//# sourceMappingURL=admin-ai-prompt.controller.js.map