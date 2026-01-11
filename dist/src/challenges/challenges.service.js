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
exports.ChallengesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const challenge_entity_1 = require("./entities/challenge.entity");
const user_challenge_entity_1 = require("./entities/user-challenge.entity");
let ChallengesService = class ChallengesService {
    constructor(challengeRepository, userChallengeRepository) {
        this.challengeRepository = challengeRepository;
        this.userChallengeRepository = userChallengeRepository;
    }
    async getChallengeById(challengeId) {
        const challenge = await this.challengeRepository.findOne({
            where: {
                id: challengeId,
                is_active: true,
                is_deleted: false,
            },
        });
        if (!challenge) {
            throw new common_1.NotFoundException('Challenge not found');
        }
        return challenge;
    }
    async getUserChallenge(userId, challengeId) {
        const userChallenge = await this.userChallengeRepository.findOne({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                is_deleted: false,
            },
            relations: ['challenge'],
        });
        if (!userChallenge) {
            throw new common_1.NotFoundException('User challenge not found');
        }
        return userChallenge;
    }
    async startChallenge(userId, challengeId) {
        const challenge = await this.getChallengeById(challengeId);
        const existingChallenge = await this.userChallengeRepository.findOne({
            where: {
                user_id: userId,
                challenge_id: challengeId,
                status: 'active',
                is_deleted: false,
            },
        });
        if (existingChallenge) {
            throw new common_1.BadRequestException('You already have an active challenge of this type');
        }
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + challenge.duration_days);
        const userChallenge = this.userChallengeRepository.create({
            user_id: userId,
            challenge_id: challengeId,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            current_day: 1,
            completed_days: [],
        });
        return await this.userChallengeRepository.save(userChallenge);
    }
    async markDayComplete(userId, challengeId, day) {
        const userChallenge = await this.getUserChallenge(userId, challengeId);
        if (userChallenge.status !== 'active') {
            throw new common_1.BadRequestException('Challenge is not active');
        }
        if (day < 1 || day > userChallenge.challenge.duration_days) {
            throw new common_1.BadRequestException(`Day must be between 1 and ${userChallenge.challenge.duration_days}`);
        }
        const completedDays = userChallenge.completed_days || [];
        if (!completedDays.includes(day)) {
            completedDays.push(day);
            userChallenge.completed_days = completedDays.sort((a, b) => a - b);
        }
        userChallenge.current_day = Math.max(userChallenge.current_day, day + 1);
        if (completedDays.length === userChallenge.challenge.duration_days) {
            userChallenge.status = 'completed';
        }
        return await this.userChallengeRepository.save(userChallenge);
    }
    async getAvailableChallenges() {
        return this.challengeRepository.find({
            where: {
                is_active: true,
                is_deleted: false,
            },
            order: {
                duration_days: 'ASC',
            },
        });
    }
    async getUserChallenges(userId) {
        return this.userChallengeRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
            },
            relations: ['challenge'],
            order: {
                added_date: 'DESC',
            },
        });
    }
};
exports.ChallengesService = ChallengesService;
exports.ChallengesService = ChallengesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(challenge_entity_1.Challenge)),
    __param(1, (0, typeorm_1.InjectRepository)(user_challenge_entity_1.UserChallenge)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChallengesService);
//# sourceMappingURL=challenges.service.js.map