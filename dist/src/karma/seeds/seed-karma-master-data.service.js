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
var SeedKarmaMasterDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedKarmaMasterDataService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_category_entity_1 = require("../entities/karma-category.entity");
const karma_weight_rule_entity_1 = require("../entities/karma-weight-rule.entity");
const karma_habit_suggestion_entity_1 = require("../entities/karma-habit-suggestion.entity");
let SeedKarmaMasterDataService = SeedKarmaMasterDataService_1 = class SeedKarmaMasterDataService {
    constructor(categoryRepository, weightRuleRepository, habitRepository) {
        this.categoryRepository = categoryRepository;
        this.weightRuleRepository = weightRuleRepository;
        this.habitRepository = habitRepository;
        this.logger = new common_1.Logger(SeedKarmaMasterDataService_1.name);
    }
    async onModuleInit() {
        this.logger.log('Starting Karma Master Data Seeding...');
        await this.seedCategories();
        await this.seedWeightRules();
        await this.seedHabitSuggestions();
        this.logger.log('Karma Master Data Seeding Complete!');
    }
    async seedCategories() {
        const categories = [
            { slug: 'good_deeds', name: 'Good Deeds', default_type: 'good' },
            { slug: 'personal_growth', name: 'Personal Growth', default_type: 'good' },
            { slug: 'relationship', name: 'Relationship', default_type: 'neutral' },
            { slug: 'health', name: 'Health', default_type: 'good' },
            { slug: 'negative_karma', name: 'Negative Karma', default_type: 'bad' },
            { slug: 'spiritual', name: 'Spiritual Practice', default_type: 'good' },
            { slug: 'social', name: 'Social Interactions', default_type: 'neutral' },
            { slug: 'financial', name: 'Financial Actions', default_type: 'neutral' },
            { slug: 'behavioral', name: 'Behavioral', default_type: 'neutral' },
        ];
        for (const cat of categories) {
            const existing = await this.categoryRepository.findOne({ where: { slug: cat.slug } });
            if (!existing) {
                const newCategory = this.categoryRepository.create(cat);
                await this.categoryRepository.save(newCategory);
                this.logger.log(`Created category: ${cat.name}`);
            }
        }
    }
    async seedWeightRules() {
        const rules = [
            {
                category_slug: 'social',
                pattern_key: 'helping',
                pattern_name: 'Helping Others',
                karma_type: 'good',
                base_weight: 20,
                keywords: ['help', 'assist', 'support', 'aid', 'volunteer', 'serve'],
            },
            {
                category_slug: 'financial',
                pattern_key: 'donating',
                pattern_name: 'Donating/Charity',
                karma_type: 'good',
                base_weight: 30,
                keywords: ['donate', 'charity', 'give', 'contribute', 'philanthropy'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'truth',
                pattern_name: 'Telling Truth',
                karma_type: 'good',
                base_weight: 10,
                keywords: ['truth', 'honest', 'truthful', 'sincere', 'authentic'],
            },
            {
                category_slug: 'personal',
                pattern_key: 'learning',
                pattern_name: 'Learning New Skills',
                karma_type: 'good',
                base_weight: 15,
                keywords: ['learn', 'study', 'practice', 'improve', 'skill', 'education'],
            },
            {
                category_slug: 'spiritual',
                pattern_key: 'kindness',
                pattern_name: 'Acts of Kindness',
                karma_type: 'good',
                base_weight: 25,
                keywords: ['kind', 'kindness', 'compassion', 'caring', 'gentle', 'loving'],
            },
            {
                category_slug: 'spiritual',
                pattern_key: 'mindfulness',
                pattern_name: 'Mindfulness Practice',
                karma_type: 'good',
                base_weight: 15,
                keywords: ['meditate', 'mindful', 'meditation', 'awareness', 'present'],
            },
            {
                category_slug: 'spiritual',
                pattern_key: 'gratitude',
                pattern_name: 'Gratitude Practice',
                karma_type: 'good',
                base_weight: 12,
                keywords: ['grateful', 'thankful', 'appreciation', 'gratitude'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'lying',
                pattern_name: 'Lying/Dishonesty',
                karma_type: 'bad',
                base_weight: -20,
                keywords: ['lie', 'lying', 'dishonest', 'deceive', 'cheat', 'fraud'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'anger',
                pattern_name: 'Anger/Rage',
                karma_type: 'bad',
                base_weight: -25,
                keywords: ['anger', 'angry', 'rage', 'furious', 'irritated', 'frustrated'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'laziness',
                pattern_name: 'Laziness/Procrastination',
                karma_type: 'bad',
                base_weight: -15,
                keywords: ['lazy', 'procrastinate', 'delay', 'postpone', 'sloth'],
            },
            {
                category_slug: 'social',
                pattern_key: 'hurting',
                pattern_name: 'Hurting Someone',
                karma_type: 'bad',
                base_weight: -40,
                keywords: ['hurt', 'harm', 'damage', 'injure', 'pain', 'suffer'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'ego',
                pattern_name: 'Ego/Selfishness',
                karma_type: 'bad',
                base_weight: -18,
                keywords: ['selfish', 'ego', 'arrogant', 'pride', 'greed', 'self-centered'],
            },
            {
                category_slug: 'behavioral',
                pattern_key: 'dishonesty',
                pattern_name: 'Dishonest Behavior',
                karma_type: 'bad',
                base_weight: -22,
                keywords: ['cheat', 'steal', 'deceive', 'fraud', 'scam', 'trick'],
            },
        ];
        for (const rule of rules) {
            const existing = await this.weightRuleRepository.findOne({
                where: { category_slug: rule.category_slug, pattern_key: rule.pattern_key },
            });
            if (!existing) {
                await this.weightRuleRepository.save(this.weightRuleRepository.create(rule));
                this.logger.log(`Created weight rule: ${rule.pattern_name}`);
            }
        }
    }
    async seedHabitSuggestions() {
        const habits = [
            {
                pattern_key: 'anger',
                habit_title: 'Daily Meditation Practice',
                habit_description: 'Practice 10 minutes of meditation daily to manage anger and emotional responses.',
                priority: 1,
                duration_days: 30,
                daily_tasks: [
                    'Morning: 10-minute breathing meditation',
                    'Evening: Reflect on emotional triggers',
                    'Before sleep: Gratitude journaling',
                ],
                motivational_message: 'Meditation helps you respond, not react. Each day of practice strengthens your emotional control.',
            },
            {
                pattern_key: 'anger',
                habit_title: 'Pause Before Reacting',
                habit_description: 'Count to 10 before responding to emotional situations.',
                priority: 2,
                duration_days: 30,
                daily_tasks: [
                    'Practice counting to 10 when feeling angry',
                    'Take 3 deep breaths before responding',
                    'Write down your feelings before speaking',
                ],
                motivational_message: 'A moment of pause can prevent a lifetime of regret.',
            },
            {
                pattern_key: 'anger',
                habit_title: 'Evening Reflection Journal',
                habit_description: 'Journal about your emotional responses and triggers before sleep.',
                priority: 3,
                duration_days: 30,
                daily_tasks: [
                    'Write about today\'s emotional moments',
                    'Identify what triggered your reactions',
                    'Plan better responses for tomorrow',
                ],
                motivational_message: 'Self-awareness is the first step to emotional mastery.',
            },
            {
                pattern_key: 'laziness',
                habit_title: 'Pomodoro Technique',
                habit_description: 'Use 25-minute focused work sessions with 5-minute breaks.',
                priority: 1,
                duration_days: 30,
                daily_tasks: [
                    'Complete 4 Pomodoro sessions (25 min each)',
                    'Take 5-minute breaks between sessions',
                    'Track completed tasks',
                ],
                motivational_message: 'Small consistent actions create massive results over time.',
            },
            {
                pattern_key: 'laziness',
                habit_title: 'Morning Routine Setup',
                habit_description: 'Establish a consistent morning routine to start the day with purpose.',
                priority: 2,
                duration_days: 30,
                daily_tasks: [
                    'Wake up at the same time daily',
                    'Complete morning routine checklist',
                    'Set 3 priorities for the day',
                ],
                motivational_message: 'How you start your day determines how you live your life.',
            },
            {
                pattern_key: 'laziness',
                habit_title: 'Evening Task Planning',
                habit_description: 'Plan tomorrow\'s tasks the night before.',
                priority: 3,
                duration_days: 30,
                daily_tasks: [
                    'Write tomorrow\'s task list',
                    'Prioritize top 3 tasks',
                    'Review today\'s accomplishments',
                ],
                motivational_message: 'A plan written is a plan executed. Tomorrow\'s success starts tonight.',
            },
            {
                pattern_key: 'dishonesty',
                habit_title: 'Truth Journaling',
                habit_description: 'Daily practice of writing honestly about your actions and intentions.',
                priority: 1,
                duration_days: 30,
                daily_tasks: [
                    'Morning: Set intention to be truthful',
                    'Evening: Review actions with honesty',
                    'Note any moments of temptation to be dishonest',
                ],
                motivational_message: 'Honesty with yourself is the foundation of all growth.',
            },
            {
                pattern_key: 'dishonesty',
                habit_title: 'Mindfulness Check-in',
                habit_description: 'Regular check-ins to assess your truthfulness and integrity.',
                priority: 2,
                duration_days: 30,
                daily_tasks: [
                    '3 daily check-ins: morning, noon, evening',
                    'Ask: "Am I being truthful right now?"',
                    'Acknowledge and correct any dishonesty immediately',
                ],
                motivational_message: 'Integrity is doing the right thing even when no one is watching.',
            },
            {
                pattern_key: 'dishonesty',
                habit_title: 'Accountability Partner',
                habit_description: 'Share your commitment to honesty with a trusted person.',
                priority: 3,
                duration_days: 30,
                daily_tasks: [
                    'Daily check-in with accountability partner',
                    'Share challenges and victories',
                    'Ask for support when needed',
                ],
                motivational_message: 'We are stronger together. Honesty shared is honesty strengthened.',
            },
            {
                pattern_key: 'kindness',
                habit_title: 'Daily Act of Kindness',
                habit_description: 'Perform at least one intentional act of kindness every day.',
                priority: 1,
                duration_days: 30,
                daily_tasks: [
                    'Morning: Plan one act of kindness',
                    'Execute the act during the day',
                    'Evening: Reflect on the impact',
                ],
                motivational_message: 'Kindness is a language that everyone understands.',
            },
            {
                pattern_key: 'kindness',
                habit_title: 'Weekly Volunteering',
                habit_description: 'Dedicate time each week to volunteer or help others.',
                priority: 2,
                duration_days: 30,
                daily_tasks: [
                    'Plan weekly volunteer activity',
                    'Reflect on how you helped others',
                    'Express gratitude for the opportunity to serve',
                ],
                motivational_message: 'Service to others is the rent we pay for our room on earth.',
            },
            {
                pattern_key: 'kindness',
                habit_title: 'Gratitude Expression',
                habit_description: 'Express gratitude to at least one person daily.',
                priority: 3,
                duration_days: 30,
                daily_tasks: [
                    'Identify someone to thank',
                    'Express gratitude sincerely',
                    'Write gratitude note or message',
                ],
                motivational_message: 'Gratitude turns what we have into enough.',
            },
        ];
        for (const habit of habits) {
            const existing = await this.habitRepository.findOne({
                where: { pattern_key: habit.pattern_key, habit_title: habit.habit_title },
            });
            if (!existing) {
                await this.habitRepository.save(this.habitRepository.create(habit));
                this.logger.log(`Created habit suggestion: ${habit.habit_title}`);
            }
        }
    }
};
exports.SeedKarmaMasterDataService = SeedKarmaMasterDataService;
exports.SeedKarmaMasterDataService = SeedKarmaMasterDataService = SeedKarmaMasterDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(karma_category_entity_1.KarmaCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(karma_weight_rule_entity_1.KarmaWeightRule)),
    __param(2, (0, typeorm_1.InjectRepository)(karma_habit_suggestion_entity_1.KarmaHabitSuggestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedKarmaMasterDataService);
//# sourceMappingURL=seed-karma-master-data.service.js.map