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
let AppKarmaController = class AppKarmaController {
    constructor(karmaService) {
        this.karmaService = karmaService;
    }
    async getTodayKarma(user) {
        const userId = user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dashboard = await this.karmaService.getDashboardSummary(userId);
        const todayEntries = dashboard.recent_actions?.filter((entry) => {
            const entryDate = new Date(entry.entry_date);
            return entryDate >= today && entryDate < tomorrow;
        }) || [];
        return {
            success: true,
            data: {
                karma_score: dashboard.overall?.score || 0,
                today_input_submitted: todayEntries.length > 0,
                today_input_prompt: todayEntries.length === 0
                    ? "How did you align with your values today?"
                    : null,
                streak: 0,
                weekly_heatmap: [],
                daily_alignment_tip: null,
            },
        };
    }
    async addKarmaInput(body, user) {
        const dto = {
            user_id: user.id,
            action_text: body.action_text,
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        };
        const entry = await this.karmaService.addKarmaAction(dto);
        return {
            success: true,
            data: {
                id: entry.id,
                action_text: entry.text,
                karma_type: entry.karma_type,
                score: entry.score,
                category: entry.category_name,
                created_at: entry.added_date,
            },
        };
    }
    async recordKarma(body, user) {
        const dto = {
            user_id: user.id,
            action_text: body.action_text,
            karma_type: body.karma_type,
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        };
        const entry = await this.karmaService.addKarmaAction(dto);
        const insight = await this.karmaService.getKarmaInsight(entry.id, user.id);
        return {
            success: true,
            message: 'Your action has been noted.',
            data: {
                id: entry.id,
                action_text: entry.text,
                karma_type: body.karma_type,
                karma_type_internal: entry.karma_type,
                score: entry.score,
                category: entry.category_name,
                created_at: entry.added_date,
                insight: insight,
            },
        };
    }
    async getKarmaScores(user) {
        const userId = user.id;
        const summary = await this.karmaService.getUserKarmaSummary(userId);
        const weeklyInsights = await this.karmaService.getWeeklyInsights(userId);
        const monthlyInsights = await this.karmaService.getMonthlyInsights(userId);
        return {
            success: true,
            data: {
                current_score: summary.karma_score?.karma_score || 0,
                weekly_score: weeklyInsights.karma_score || 0,
                monthly_score: monthlyInsights.karma_score || 0,
                trend: summary.karma_score?.trend || 'stable',
                grade: this.getKarmaGrade(summary.karma_score?.karma_score || 0),
            },
        };
    }
    async getDashboard(user) {
        const userId = user.id;
        const dashboard = await this.karmaService.getDashboardSummary(userId);
        return {
            success: true,
            data: {
                karma_score: dashboard.overall?.score || 0,
                karma_grade: dashboard.overall?.grade || 'Fair',
                trend: dashboard.overall?.trend || 'flat',
                total_actions: dashboard.overall?.total_actions || 0,
                recent_actions: dashboard.recent_actions?.slice(0, 10) || [],
                patterns: dashboard.patterns || [],
                improvement_plan: dashboard.improvement_plan || {},
                weekly_trend: dashboard.trends?.weekly || {},
                monthly_trend: dashboard.trends?.monthly || {},
                streak: dashboard.streak || {
                    current_days: 0,
                    longest_days: 0,
                    level: 'awaken',
                    level_name: 'Awaken',
                    next_level_threshold: 7,
                    progress_to_next_level: 0,
                },
            },
        };
    }
    async getKarmaLedger(user) {
        const userId = user.id;
        const ledger = await this.karmaService.getKarmaLedger(userId);
        return {
            success: true,
            data: ledger,
        };
    }
    async getKarmaList(filter = 'all', limit = '50', offset = '0', user) {
        const userId = user.id;
        const validFilters = ['all', 'good', 'neutral', 'challenging'];
        const karmaFilter = validFilters.includes(filter?.toLowerCase())
            ? filter.toLowerCase()
            : 'all';
        const result = await this.karmaService.getKarmaList(userId, karmaFilter, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
        return {
            success: true,
            data: result,
        };
    }
    async getKarmaPatterns(filter = 'week', user) {
        const userId = user.id;
        const validFilters = ['week', 'month', 'year'];
        const patternFilter = validFilters.includes(filter?.toLowerCase())
            ? filter.toLowerCase()
            : 'week';
        const patterns = await this.karmaService.getKarmaPatterns(userId, patternFilter);
        return {
            success: true,
            data: patterns,
        };
    }
    async getKarmaInsight(id, user) {
        const userId = user.id;
        const insight = await this.karmaService.getKarmaInsight(id, userId);
        return {
            success: true,
            data: insight,
        };
    }
    async getKarmaEntry(id, user) {
        const userId = user.id;
        const entry = await this.karmaService.getKarmaEntryById(id, userId);
        return {
            success: true,
            data: entry,
        };
    }
    getKarmaGrade(score) {
        if (score >= 80)
            return 'Excellent';
        if (score >= 65)
            return 'Good';
        if (score >= 50)
            return 'Fair';
        if (score >= 35)
            return 'Needs Improvement';
        return 'Poor';
    }
};
exports.AppKarmaController = AppKarmaController;
__decorate([
    (0, common_1.Get)('today'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Get today's karma summary (Mobile App)" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Today's karma data retrieved successfully",
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getTodayKarma", null);
__decorate([
    (0, common_1.Post)('input'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add karma input/action (Mobile App - Auto-classified)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Karma input added successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "addKarmaInput", null);
__decorate([
    (0, common_1.Post)('record'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Record karma with selected type (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Karma recorded successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "recordKarma", null);
__decorate([
    (0, common_1.Get)('scores'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma scores (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma scores retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaScores", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma dashboard (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard data retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma ledger summary (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma ledger retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaLedger", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma list with filters (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma list retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaList", null);
__decorate([
    (0, common_1.Get)('patterns'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma patterns with time filter (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma patterns retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppKarmaController.prototype, "getKarmaPatterns", null);
__decorate([
    (0, common_1.Get)(':id/insight'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get karma insight for an entry (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma insight retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Karma entry not found',
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
    (0, swagger_1.ApiOperation)({ summary: 'Get karma entry details (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Karma entry retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Karma entry not found',
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