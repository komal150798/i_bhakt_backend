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
exports.ZunoMemoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const memory_service_1 = require("../services/memory.service");
const memory_dtos_1 = require("../dtos/memory.dtos");
const memory_enum_1 = require("../enums/memory.enum");
let ZunoMemoryController = class ZunoMemoryController {
    constructor(memory) {
        this.memory = memory;
    }
    async list(user, query) {
        const rows = await this.memory.listForUser(user.id, {
            type: query.type,
            challengeId: query.challengeId,
            scope: query.scope,
        });
        return rows.map((row) => memory_dtos_1.MemoryView.from(row, (0, memory_service_1.whyItMatters)(row)));
    }
    async summary(user) {
        return this.memory.summaryForUser(user.id);
    }
    async candidates(user) {
        const rows = await this.memory.pendingCandidates(user.id);
        return rows.map(memory_dtos_1.MemoryCandidateView.from);
    }
    async confirm(user, candidateId) {
        const memory = await this.memory.confirmCandidate(user.id, candidateId);
        return memory_dtos_1.MemoryView.from(memory, (0, memory_service_1.whyItMatters)(memory));
    }
    async reject(user, candidateId, _dto) {
        const candidate = await this.memory.rejectCandidate(user.id, candidateId, memory_enum_1.MemoryRejectionReason.USER_REJECTED);
        return { id: candidate.id, status: candidate.status };
    }
    async clearChallenge(user, challengeId) {
        const deleted = await this.memory.deleteChallengeMemory(user.id, challengeId);
        return { deleted };
    }
    async correct(user, memoryId, dto) {
        const corrected = await this.memory.correct({
            userId: user.id,
            memoryId,
            statement: dto.statement,
            label: dto.label,
            expectedVersion: dto.version,
        });
        return memory_dtos_1.MemoryView.from(corrected, (0, memory_service_1.whyItMatters)(corrected));
    }
    async remove(user, memoryId) {
        await this.memory.deleteMemory(user.id, memoryId, 'USER_REQUESTED');
        return { id: memoryId, deleted: true, stopsInfluencingGuidance: true };
    }
    async history(user, memoryId) {
        const chain = await this.memory.supersessionChain(user.id, memoryId);
        return chain.map((row) => memory_dtos_1.MemoryView.from(row, (0, memory_service_1.whyItMatters)(row)));
    }
};
exports.ZunoMemoryController = ZunoMemoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'What ZUNO currently remembers about you' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        memory_dtos_1.ListMemoryQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Grouped, readable summary of retained memory' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('candidates'),
    (0, swagger_1.ApiOperation)({ summary: 'Memories ZUNO would like to confirm with you' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "candidates", null);
__decorate([
    (0, common_1.Post)('candidates/:candidateId/confirm'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a memory ZUNO asked about' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already decided.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('candidateId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)('candidates/:candidateId/reject'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Tell ZUNO not to keep this' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('candidateId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, memory_dtos_1.RejectCandidateDto]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)('challenge/:challengeId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Forget everything tied to one challenge' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('challengeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "clearChallenge", null);
__decorate([
    (0, common_1.Patch)(':memoryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Correct something ZUNO got wrong' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version, or not correctable.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('memoryId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, memory_dtos_1.CorrectMemoryDto]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "correct", null);
__decorate([
    (0, common_1.Delete)(':memoryId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Ask ZUNO to forget this' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('memoryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':memoryId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'What this memory replaced' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('memoryId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoMemoryController.prototype, "history", null);
exports.ZunoMemoryController = ZunoMemoryController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Memory'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('memory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [memory_service_1.MemoryService])
], ZunoMemoryController);
//# sourceMappingURL=memory.controller.js.map