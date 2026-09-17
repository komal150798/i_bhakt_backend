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
exports.ZunoChallengeMkaController = exports.ZunoMkaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const mka_service_1 = require("../services/mka.service");
const mka_dtos_1 = require("../dtos/mka.dtos");
let ZunoMkaController = class ZunoMkaController {
    constructor(mka, idempotency) {
        this.mka = mka;
        this.idempotency = idempotency;
    }
    async current(user, query) {
        if (!query.challengeId) {
            const programs = await this.mka.listPrograms(user.id);
            return programs.map((program) => mka_dtos_1.MkaProgramView.from(program, []));
        }
        const { program, items } = await this.mka.currentForChallenge(user, query.challengeId);
        return mka_dtos_1.MkaProgramView.from(program, items);
    }
    async detail(user, programId) {
        const program = await this.mka.findOwnedProgram(user.id, programId);
        const items = await this.mka.itemsFor(program.id);
        return mka_dtos_1.MkaProgramView.from(program, items);
    }
    async generate(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'MKA_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { program, items } = await this.mka.generate({
                user,
                challengeId: dto.challengeId,
                period: dto.period,
                regenerate: dto.regenerate === true,
            });
            return { ...mka_dtos_1.MkaProgramView.from(program, items) };
        });
    }
    async complete(user, itemId, dto) {
        const completion = await this.mka.completeItem(user, itemId, {
            date: dto.date,
            note: dto.note,
        });
        return mka_dtos_1.MkaCompletionView.from(completion);
    }
    async skip(user, itemId, dto) {
        const completion = await this.mka.skipItem(user, itemId, {
            date: dto.date,
            note: dto.note,
        });
        return mka_dtos_1.MkaCompletionView.from(completion);
    }
    async completions(user, programId) {
        await this.mka.findOwnedProgram(user.id, programId);
        const rows = await this.mka.completionsFor(user.id, programId);
        return rows.map(mka_dtos_1.MkaCompletionView.from);
    }
};
exports.ZunoMkaController = ZunoMkaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get the current MKA programme for a WhatNow" }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'No programme generated yet.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        mka_dtos_1.ListMkaQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "current", null);
__decorate([
    (0, common_1.Get)(':programId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one MKA programme, including superseded ones' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('programId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Generate the Mind / Karma / Action programme' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Programme generated or returned.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        mka_dtos_1.GenerateMkaDto, String]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)('items/:itemId/complete'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an MKA practice done for a date' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Programme or item is not active.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, mka_dtos_1.CompleteMkaItemDto]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('items/:itemId/skip'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Skip an MKA practice for a date, without penalty' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, mka_dtos_1.SkipMkaItemDto]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "skip", null);
__decorate([
    (0, common_1.Get)(':programId/completions'),
    (0, swagger_1.ApiOperation)({ summary: 'Completion history for a programme' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('programId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMkaController.prototype, "completions", null);
exports.ZunoMkaController = ZunoMkaController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Mind Karma Action'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('mka'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [mka_service_1.MkaService,
        idempotency_service_1.IdempotencyService])
], ZunoMkaController);
let ZunoChallengeMkaController = class ZunoChallengeMkaController {
    constructor(mka, idempotency) {
        this.mka = mka;
        this.idempotency = idempotency;
    }
    async current(user, challengeId) {
        const { program, items } = await this.mka.currentForChallenge(user, challengeId);
        return mka_dtos_1.MkaProgramView.from(program, items);
    }
    async generate(user, challengeId, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'MKA_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: { challengeId, ...dto },
        }, async () => {
            const { program, items } = await this.mka.generate({
                user,
                challengeId,
                period: dto?.period,
                regenerate: dto?.regenerate === true,
            });
            return { ...mka_dtos_1.MkaProgramView.from(program, items) };
        });
    }
};
exports.ZunoChallengeMkaController = ZunoChallengeMkaController;
__decorate([
    (0, common_1.Get)(':challengeId/mka'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current MKA programme for this WhatNow' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengeMkaController.prototype, "current", null);
__decorate([
    (0, common_1.Post)(':challengeId/mka/generate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Generate the MKA programme for this WhatNow' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, Object, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengeMkaController.prototype, "generate", null);
exports.ZunoChallengeMkaController = ZunoChallengeMkaController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Mind Karma Action'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('challenges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [mka_service_1.MkaService,
        idempotency_service_1.IdempotencyService])
], ZunoChallengeMkaController);
//# sourceMappingURL=mka.controller.js.map