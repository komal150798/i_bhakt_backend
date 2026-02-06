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
exports.AppKarmaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const karma_service_1 = require("../services/karma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const record_karma_dto_1 = require("../dtos/record-karma.dto");
let AppKarmaController = class AppKarmaController {
    constructor(karmaService) {
        this.karmaService = karmaService;
    }
    async getKarmaLedger(user) {
        const data = await this.karmaService.getKarmaLedger(user.id);
        return { success: true, data };
    }
    async recordKarma(dto, user) {
        const data = await this.karmaService.recordKarma({
            user_id: user.id,
            karma_type: dto.karma_type,
            description: dto.description,
            intention: dto.intention,
            emotional_context: dto.emotional_context,
        });
        return { success: true, data };
    }
    async getKarmaList(user, filter) {
        const data = await this.karmaService.getKarmaList(user.id, filter);
        return { success: true, data };
    }
    async getKarmaPatterns(user, filter) {
        const data = await this.karmaService.getKarmaPatterns(user.id, filter);
        return { success: true, data };
    }
    async getKarmaInsight(id, user) {
        const data = await this.karmaService.getKarmaInsight(id, user.id);
        return { success: true, data };
    }
    async getKarmaEntry(id, user) {
        const data = await this.karmaService.getKarmaEntryById(id, user.id);
        return { success: true, data };
    }
};
exports.AppKarmaController = AppKarmaController;
__decorate([
    (0, common_1.Get)('ledger'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get Karma Ledger dashboard (Screen 02.1)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma ledger data with awareness level, distribution, and tips',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaLedger", null);
__decorate([
    (0, common_1.Post)('record'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Record a karma action (Screen 02.2 & 02.3)' }),
    (0, swagger_1.ApiBody)({
        type: record_karma_dto_1.RecordKarmaDto,
        description: 'Karma action with type and description',
        examples: {
            good: {
                summary: 'Record a good karma action',
                value: {
                    karma_type: 'good',
                    description: 'Helped a colleague with a difficult project without being asked.',
                    intention: 'Genuine support',
                    emotional_context: 'Compassion and satisfaction',
                },
            },
            neutral: {
                summary: 'Record a neutral karma action',
                value: {
                    karma_type: 'neutral',
                    description: 'Observed a conflict without taking sides.',
                },
            },
            challenging: {
                summary: 'Record a challenging karma action',
                value: {
                    karma_type: 'challenging',
                    description: 'Lost patience during a meeting.',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Karma action recorded successfully with confirmation',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [record_karma_dto_1.RecordKarmaDto, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "recordKarma", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma entries list with filters (Screen 02.5B)' }),
    (0, swagger_1.ApiQuery)({
        name: 'filter',
        required: false,
        enum: ['all', 'good', 'neutral', 'challenging'],
        description: 'Filter karma entries by type',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Filtered karma entries list with legend',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaList", null);
__decorate([
    (0, common_1.Get)('patterns'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma patterns chart data (Screen 02.7)' }),
    (0, swagger_1.ApiQuery)({
        name: 'filter',
        required: false,
        enum: ['week', 'month', 'year'],
        description: 'Time range filter for patterns',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma patterns chart data with daily/monthly breakdown',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaPatterns", null);
__decorate([
    (0, common_1.Get)(':id/insight'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma insight for a specific entry (Screen 02.4)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Karma entry ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma insight with alignment gauge and description',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaInsight", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma entry details (Screen 02.5A)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Karma entry ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Full karma entry details with teaching and phase impact',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaEntry", null);
exports.AppKarmaController = AppKarmaController = __decorate([
    (0, swagger_1.ApiTags)('Karma (App)'),
    (0, common_1.Controller)('app/karma'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [karma_service_1.KarmaService])
], AppKarmaController);
//# sourceMappingURL=app-karma.controller.js.map