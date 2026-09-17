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
exports.ZunoMeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const zuno_profile_service_1 = require("../services/zuno-profile.service");
const identity_dtos_1 = require("../dtos/identity.dtos");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
let ZunoMeController = class ZunoMeController {
    constructor(profiles) {
        this.profiles = profiles;
    }
    async me(user) {
        const profile = await this.profiles.getProfile(user.id);
        return identity_dtos_1.MeView.from(user, profile);
    }
    async getProfile(user) {
        const profile = await this.profiles.getProfile(user.id);
        return identity_dtos_1.ProfileView.from(profile, user);
    }
    async updateProfile(user, dto) {
        const { profile, user: updated } = await this.profiles.updateProfile(user, dto);
        return identity_dtos_1.ProfileView.from(profile, updated);
    }
    async getBirthProfile(user) {
        const profile = await this.profiles.getBirthProfile(user.id);
        if (!profile) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.NOT_FOUND, {
                message: 'No birth details saved yet.',
            });
        }
        return identity_dtos_1.BirthProfileView.from(profile);
    }
    async putBirthProfile(user, dto) {
        const profile = await this.profiles.upsertBirthProfile(user, dto);
        return identity_dtos_1.BirthProfileView.from(profile);
    }
};
exports.ZunoMeController = ZunoMeController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Current ZUNO user' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoMeController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get profile' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoMeController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile (partial)' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        identity_dtos_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ZunoMeController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('birth-profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get birth profile' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not provided yet.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoMeController.prototype, "getBirthProfile", null);
__decorate([
    (0, common_1.Put)('birth-profile'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Create or replace birth profile' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'A birth time is required unless accuracy is UNKNOWN.',
    }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        identity_dtos_1.UpsertBirthProfileDto]),
    __metadata("design:returntype", Promise)
], ZunoMeController.prototype, "putBirthProfile", null);
exports.ZunoMeController = ZunoMeController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Me'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [zuno_profile_service_1.ZunoProfileService])
], ZunoMeController);
//# sourceMappingURL=me.controller.js.map