import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmaCategory } from '../entities/karma-category.entity';
import { KarmaWeightRule } from '../entities/karma-weight-rule.entity';
import { KarmaHabitSuggestion } from '../entities/karma-habit-suggestion.entity';

@Injectable()
export class SeedKarmaMasterDataService implements OnModuleInit {
  private readonly logger = new Logger(SeedKarmaMasterDataService.name);

  constructor(
    @InjectRepository(KarmaCategory)
    private readonly categoryRepository: Repository<KarmaCategory>,
    @InjectRepository(KarmaWeightRule)
    private readonly weightRuleRepository: Repository<KarmaWeightRule>,
    @InjectRepository(KarmaHabitSuggestion)
    private readonly habitRepository: Repository<KarmaHabitSuggestion>,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Karma Master Data Seeding...');
    await this.seedCategories();
    await this.seedWeightRules();
    await this.seedHabitSuggestions();
    this.logger.log('Karma Master Data Seeding Complete!');
  }

  private async seedCategories() {
    const categories: Array<{
      slug: string;
      name: string;
      default_type: 'good' | 'bad' | 'neutral';
    }> = [
      // Strategy Document Aligned Categories
      { slug: 'good_deeds', name: 'Good Deeds', default_type: 'good' as const },
      { slug: 'personal_growth', name: 'Personal Growth', default_type: 'good' as const },
      { slug: 'relationship', name: 'Relationship', default_type: 'neutral' as const },
      { slug: 'health', name: 'Health', default_type: 'good' as const },
      { slug: 'negative_karma', name: 'Negative Karma', default_type: 'bad' as const },
      // Additional categories for backward compatibility and granularity
      { slug: 'spiritual', name: 'Spiritual Practice', default_type: 'good' as const },
      { slug: 'social', name: 'Social Interactions', default_type: 'neutral' as const },
      { slug: 'financial', name: 'Financial Actions', default_type: 'neutral' as const },
      { slug: 'behavioral', name: 'Behavioral', default_type: 'neutral' as const },
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

  private async seedWeightRules() {
    const rules = [
      // Good Karma Rules
      {
        category_slug: 'social',
        pattern_key: 'helping',
        pattern_name: 'Helping Others',
        karma_type: 'good' as const,
        base_weight: 20,
        keywords: ['help', 'assist', 'support', 'aid', 'volunteer', 'serve'],
      },
      {
        category_slug: 'financial',
        pattern_key: 'donating',
        pattern_name: 'Donating/Charity',
        karma_type: 'good' as const,
        base_weight: 30,
        keywords: ['donate', 'charity', 'give', 'contribute', 'philanthropy'],
      },
      {
        category_slug: 'behavioral',
        pattern_key: 'truth',
        pattern_name: 'Telling Truth',
        karma_type: 'good' as const,
        base_weight: 10,
        keywords: ['truth', 'honest', 'truthful', 'sincere', 'authentic'],
      },
      {
        category_slug: 'personal',
        pattern_key: 'learning',
        pattern_name: 'Learning New Skills',
        karma_type: 'good' as const,
        base_weight: 15,
        keywords: ['learn', 'study', 'practice', 'improve', 'skill', 'education'],
      },
      {
        category_slug: 'spiritual',
        pattern_key: 'kindness',
        pattern_name: 'Acts of Kindness',
        karma_type: 'good' as const,
        base_weight: 25,
        keywords: ['kind', 'kindness', 'compassion', 'caring', 'gentle', 'loving'],
      },
      {
        category_slug: 'spiritual',
        pattern_key: 'mindfulness',
        pattern_name: 'Mindfulness Practice',
        karma_type: 'good' as const,
        base_weight: 15,
        keywords: ['meditate', 'mindful', 'meditation', 'awareness', 'present'],
      },
      {
        category_slug: 'spiritual',
        pattern_key: 'gratitude',
        pattern_name: 'Gratitude Practice',
        karma_type: 'good' as const,
        base_weight: 12,
        keywords: ['grateful', 'thankful', 'appreciation', 'gratitude'],
      },

      // Bad Karma Rules
      {
        category_slug: 'behavioral',
        pattern_key: 'lying',
        pattern_name: 'Lying/Dishonesty',
        karma_type: 'bad' as const,
        base_weight: -20,
        keywords: ['lie', 'lying', 'dishonest', 'deceive', 'cheat', 'fraud'],
      },
      {
        category_slug: 'behavioral',
        pattern_key: 'anger',
        pattern_name: 'Anger/Rage',
        karma_type: 'bad' as const,
        base_weight: -25,
        keywords: ['anger', 'angry', 'rage', 'furious', 'irritated', 'frustrated'],
      },
      {
        category_slug: 'behavioral',
        pattern_key: 'laziness',
        pattern_name: 'Laziness/Procrastination',
        karma_type: 'bad' as const,
        base_weight: -15,
        keywords: ['lazy', 'procrastinate', 'delay', 'postpone', 'sloth'],
      },
      {
        category_slug: 'social',
        pattern_key: 'hurting',
        pattern_name: 'Hurting Someone',
        karma_type: 'bad' as const,
        base_weight: -40,
        keywords: ['hurt', 'harm', 'damage', 'injure', 'pain', 'suffer'],
      },
      {
        category_slug: 'behavioral',
        pattern_key: 'ego',
        pattern_name: 'Ego/Selfishness',
        karma_type: 'bad' as const,
        base_weight: -18,
        keywords: ['selfish', 'ego', 'arrogant', 'pride', 'greed', 'self-centered'],
      },
      {
        category_slug: 'behavioral',
        pattern_key: 'dishonesty',
        pattern_name: 'Dishonest Behavior',
        karma_type: 'bad' as const,
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

  private async seedHabitSuggestions() {
    const habits = [
      // Anger habits
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

      // Laziness habits
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

      // Dishonesty habits
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

      // Kindness habits
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
}

