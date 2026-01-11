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
var KarmaStreakService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarmaStreakService = void 0;
const common_1 = require("@nestjs/common");
let KarmaStreakService = KarmaStreakService_1 = class KarmaStreakService {
    constructor(karmaRepository) {
        this.karmaRepository = karmaRepository;
        this.logger = new common_1.Logger(KarmaStreakService_1.name);
    }
    async calculateStreak(userId) {
        const allEntries = await this.karmaRepository.findByUserId(userId);
        const sortedEntries = allEntries
            .filter(e => !e.is_deleted)
            .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
        let currentStreak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.entry_date);
            entryDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === currentStreak) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else if (daysDiff > currentStreak) {
                break;
            }
        }
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;
        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.entry_date);
            entryDate.setHours(0, 0, 0, 0);
            if (!lastDate) {
                tempStreak = 1;
                lastDate = entryDate;
            }
            else {
                const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    tempStreak++;
                }
                else if (daysDiff > 1) {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
                lastDate = entryDate;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        const level = this.determineLevel(currentStreak, longestStreak);
        const levelInfo = this.getLevelInfo(level);
        return {
            current_streak_days: currentStreak,
            longest_streak_days: longestStreak,
            level: level.level,
            level_name: levelInfo.name,
            next_level_threshold: levelInfo.nextThreshold,
            progress_to_next_level: levelInfo.progress,
        };
    }
    determineLevel(currentStreak, longestStreak) {
        const maxStreak = Math.max(currentStreak, longestStreak);
        if (maxStreak >= 90) {
            return { level: 'master', score: 100 };
        }
        else if (maxStreak >= 30) {
            return { level: 'pro', score: 75 };
        }
        else if (maxStreak >= 7) {
            return { level: 'builder', score: 50 };
        }
        else {
            return { level: 'awaken', score: 25 };
        }
    }
    getLevelInfo(level) {
        const levels = {
            awaken: { name: 'Awaken', next: 7, current: 0 },
            builder: { name: 'Disciplined Bhakt', next: 30, current: 7 },
            pro: { name: 'Karma Yogi', next: 90, current: 30 },
            master: { name: 'Sattvik', next: 999, current: 90 },
        };
        const levelData = levels[level.level] || levels.awaken;
        const progress = level.level === 'master'
            ? 100
            : Math.min(100, Math.round((level.score / levelData.next) * 100));
        return {
            name: levelData.name,
            nextThreshold: levelData.next,
            progress,
        };
    }
};
exports.KarmaStreakService = KarmaStreakService;
exports.KarmaStreakService = KarmaStreakService = KarmaStreakService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKarmaRepository')),
    __metadata("design:paramtypes", [Object])
], KarmaStreakService);
//# sourceMappingURL=karma-streak.service.js.map