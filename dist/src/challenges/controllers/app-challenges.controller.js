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
exports.AppChallengesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const challenges_service_1 = require("../challenges.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AppChallengesController = class AppChallengesController {
    constructor(challengesService) {
        this.challengesService = challengesService;
    }
    async getChallenges(user) {
        const challenges = await this.challengesService.getAvailableChallenges();
        const userChallenges = await this.challengesService.getUserChallenges(user.id);
        return {
            success: true,
            data: {
                available: challenges.map((c) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    challenge_type: c.challenge_type,
                    duration_days: c.duration_days,
                    daily_tasks: c.daily_tasks,
                })),
                user_challenges: userChallenges.map((uc) => ({
                    id: uc.id,
                    challenge_id: uc.challenge_id,
                    challenge_title: uc.challenge.title,
                    start_date: uc.start_date,
                    end_date: uc.end_date,
                    status: uc.status,
                    current_day: uc.current_day,
                    completed_days: uc.completed_days || [],
                })),
            },
        };
    }
    async getChallenge(id, user) {
        const challenge = await this.challengesService.getChallengeById(id);
        let userChallenge = null;
        try {
            userChallenge = await this.challengesService.getUserChallenge(user.id, id);
        }
        catch (e) {
        }
        return {
            success: true,
            data: {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                challenge_type: challenge.challenge_type,
                duration_days: challenge.duration_days,
                daily_tasks: challenge.daily_tasks,
                user_progress: userChallenge
                    ? {
                        status: userChallenge.status,
                        current_day: userChallenge.current_day,
                        completed_days: userChallenge.completed_days || [],
                        start_date: userChallenge.start_date,
                        end_date: userChallenge.end_date,
                    }
                    : null,
            },
        };
    }
    async startChallenge(id, user) {
        const userChallenge = await this.challengesService.startChallenge(user.id, id);
        return {
            success: true,
            data: {
                id: userChallenge.id,
                challenge_id: userChallenge.challenge_id,
                start_date: userChallenge.start_date,
                end_date: userChallenge.end_date,
                status: userChallenge.status,
                current_day: userChallenge.current_day,
            },
        };
    }
    async markDayComplete(body, user) {
        const userChallenge = await this.challengesService.markDayComplete(user.id, body.challenge_id, body.day);
        return {
            success: true,
            data: {
                challenge_id: userChallenge.challenge_id,
                current_day: userChallenge.current_day,
                completed_days: userChallenge.completed_days || [],
                status: userChallenge.status,
                is_completed: userChallenge.status === 'completed',
            },
        };
    }
};
exports.AppChallengesController = AppChallengesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available challenges (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Challenges retrieved successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppChallengesController.prototype, "getChallenges", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get challenge by ID (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Challenge retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Challenge not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppChallengesController.prototype, "getChallenge", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Start a challenge (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Challenge started successfully',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppChallengesController.prototype, "startChallenge", null);
__decorate([
    (0, common_1.Post)('day-complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark challenge day as complete (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Day marked as complete',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppChallengesController.prototype, "markDayComplete", null);
exports.AppChallengesController = AppChallengesController = __decorate([
    (0, swagger_1.ApiTags)('Challenges (App)'),
    (0, common_1.Controller)('app/challenges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [challenges_service_1.ChallengesService])
], AppChallengesController);
//# sourceMappingURL=app-challenges.controller.js.map