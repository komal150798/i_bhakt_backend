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
exports.ZunoChallengesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const challenge_service_1 = require("../services/challenge.service");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const challenge_dtos_1 = require("../dtos/challenge.dtos");
const enums_1 = require("../../common/enums");
let ZunoChallengesController = class ZunoChallengesController {
    constructor(challenges, idempotency) {
        this.challenges = challenges;
        this.idempotency = idempotency;
    }
    async create(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'CHALLENGE_CREATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const challenge = await this.challenges.create({
                user,
                statement: dto.statement,
            });
            return {
                challengeId: challenge.id,
                status: enums_1.ProcessingState.PROCESSING,
                challenge: challenge_dtos_1.ChallengeView.from(challenge),
            };
        });
    }
    async list(user, query) {
        const { items, nextCursor } = await this.challenges.list({
            userId: user.id,
            status: query.status,
            limit: query.limit ?? 20,
            cursor: query.cursor,
        });
        return new zuno_response_interceptor_1.ZunoPayload(items.map(challenge_dtos_1.ChallengeView.from), {
            nextCursor,
            hasMore: nextCursor !== null,
        });
    }
    async detail(user, challengeId) {
        const challenge = await this.challenges.findOwned(user.id, challengeId);
        const context = await this.challenges.latestContext(challenge.id);
        return challenge_dtos_1.ChallengeDetailView.fromDetail(challenge, context);
    }
    async analyze(user, challengeId, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'CHALLENGE_ANALYZE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: { challengeId },
        }, async () => {
            const { challenge, response } = await this.challenges.analyze(user, challengeId);
            return {
                challenge: challenge_dtos_1.ChallengeView.from(challenge),
                response: challenge_dtos_1.ZunoResponseView.from(response),
            };
        });
    }
    async response(user, challengeId) {
        const response = await this.challenges.latestResponse(user, challengeId);
        return challenge_dtos_1.ZunoResponseView.from(response);
    }
    async resolve(user, challengeId, dto) {
        const challenge = await this.challenges.resolve(user, challengeId, dto.note, dto.version);
        return challenge_dtos_1.ChallengeView.from(challenge);
    }
    async reopen(user, challengeId, dto) {
        const challenge = await this.challenges.reopen(user, challengeId, dto.version);
        return challenge_dtos_1.ChallengeView.from(challenge);
    }
};
exports.ZunoChallengesController = ZunoChallengesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new WhatNow from the user\'s own words' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Challenge created.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        challenge_dtos_1.CreateChallengeDto, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List the current user\'s WhatNows' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        challenge_dtos_1.ListChallengesQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':challengeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one WhatNow with its current understanding' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':challengeId/analyze'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Run the WhatNow engine over this challenge' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Understanding produced.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Intelligence layer unavailable.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "analyze", null);
__decorate([
    (0, common_1.Get)(':challengeId/response'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the latest adaptive response' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Not analysed yet.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "response", null);
__decorate([
    (0, common_1.Post)(':challengeId/resolve'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Mark this WhatNow resolved' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version, or illegal transition.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, challenge_dtos_1.ResolveChallengeDto]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)(':challengeId/reopen'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Reopen a resolved WhatNow' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, challenge_dtos_1.ReopenChallengeDto]),
    __metadata("design:returntype", Promise)
], ZunoChallengesController.prototype, "reopen", null);
exports.ZunoChallengesController = ZunoChallengesController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Challenges (WhatNow)'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('challenges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [challenge_service_1.ChallengeService,
        idempotency_service_1.IdempotencyService])
], ZunoChallengesController);
//# sourceMappingURL=challenges.controller.js.map