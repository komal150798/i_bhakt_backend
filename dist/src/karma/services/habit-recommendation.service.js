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
var HabitRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_habit_suggestion_entity_1 = require("../entities/karma-habit-suggestion.entity");
let HabitRecommendationService = HabitRecommendationService_1 = class HabitRecommendationService {
    constructor(habitRepository) {
        this.habitRepository = habitRepository;
        this.logger = new common_1.Logger(HabitRecommendationService_1.name);
    }
    async generateHabitPlan(userId, patternAnalysis) {
        const recommendations = [];
        for (const weakness of patternAnalysis.weaknesses) {
            const habits = await this.getHabitsForPattern(weakness);
            recommendations.push(...habits);
        }
        if (recommendations.length === 0) {
            const generalHabits = await this.getHabitsForPattern('general');
            recommendations.push(...generalHabits.slice(0, 3));
        }
        recommendations.sort((a, b) => a.priority - b.priority);
        const selectedHabits = recommendations.slice(0, 5);
        const planDuration = 30;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + planDuration);
        const dailySchedule = this.generateDailySchedule(selectedHabits, startDate, planDuration);
        return {
            user_id: userId,
            plan_duration_days: planDuration,
            start_date: startDate,
            end_date: endDate,
            habits: selectedHabits,
            daily_schedule: dailySchedule,
            motivational_quote: this.getMotivationalQuote(patternAnalysis),
        };
    }
    async getHabitsForPattern(patternKey) {
        const habits = await this.habitRepository.find({
            where: {
                pattern_key: patternKey,
                is_active: true,
            },
            order: { priority: 'ASC' },
            take: 3,
        });
        return habits.map((habit) => ({
            habit_id: habit.id,
            habit_title: habit.habit_title,
            habit_description: habit.habit_description,
            priority: habit.priority,
            duration_days: habit.duration_days,
            daily_tasks: habit.daily_tasks || [],
            motivational_message: habit.motivational_message || '',
            pattern_key: habit.pattern_key,
            pattern_name: patternKey,
        }));
    }
    generateDailySchedule(habits, startDate, durationDays) {
        const schedule = [];
        for (let day = 1; day <= durationDays; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day - 1);
            const tasks = [];
            for (const habit of habits) {
                const taskIndex = (day - 1) % (habit.daily_tasks.length || 1);
                const task = habit.daily_tasks[taskIndex] || 'Continue practicing this habit';
                tasks.push({
                    habit_title: habit.habit_title,
                    task,
                });
            }
            schedule.push({
                day,
                date,
                tasks,
            });
        }
        return schedule;
    }
    getMotivationalQuote(patternAnalysis) {
        if (patternAnalysis.weaknesses.length > 0) {
            return `"Every moment is a fresh beginning. Your awareness of these patterns is the first step toward transformation."`;
        }
        if (patternAnalysis.strengths.length > 0) {
            return `"Your positive patterns are creating a beautiful foundation. Keep nurturing your strengths!"`;
        }
        return `"Consistency is the key to lasting change. Small daily actions create profound transformations."`;
    }
    async getAllHabitSuggestions() {
        return this.habitRepository.find({
            where: { is_active: true },
            order: { priority: 'ASC' },
        });
    }
    async getHabitsByPattern(patternKey) {
        return this.habitRepository.find({
            where: {
                pattern_key: patternKey,
                is_active: true,
            },
            order: { priority: 'ASC' },
        });
    }
};
exports.HabitRecommendationService = HabitRecommendationService;
exports.HabitRecommendationService = HabitRecommendationService = HabitRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(karma_habit_suggestion_entity_1.KarmaHabitSuggestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HabitRecommendationService);
//# sourceMappingURL=habit-recommendation.service.js.map