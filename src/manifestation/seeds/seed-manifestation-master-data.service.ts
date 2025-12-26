import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ManifestCategory,
  ManifestSubcategory,
  ManifestKeyword,
  ManifestEnergyRule,
  ManifestRitualTemplate,
  ManifestToManifestTemplate,
  ManifestNotToManifestTemplate,
  ManifestAlignmentTemplate,
  ManifestInsightTemplate,
  ManifestSummaryTemplate,
} from '../entities';

/**
 * Seed Service for Manifestation Master Data
 * 
 * This service seeds all manifestation-related tables with initial data.
 * All data is stored in database tables, making the system fully dynamic.
 * 
 * To add new categories, keywords, or templates:
 * 1. Add them to this seed file
 * 2. Run the seed script
 * 3. The LLM will automatically use the new data
 */
@Injectable()
export class SeedManifestationMasterDataService implements OnModuleInit {
  private readonly logger = new Logger(SeedManifestationMasterDataService.name);

  constructor(
    @InjectRepository(ManifestCategory)
    private readonly categoryRepo: Repository<ManifestCategory>,
    @InjectRepository(ManifestSubcategory)
    private readonly subcategoryRepo: Repository<ManifestSubcategory>,
    @InjectRepository(ManifestKeyword)
    private readonly keywordRepo: Repository<ManifestKeyword>,
    @InjectRepository(ManifestEnergyRule)
    private readonly energyRuleRepo: Repository<ManifestEnergyRule>,
    @InjectRepository(ManifestRitualTemplate)
    private readonly ritualTemplateRepo: Repository<ManifestRitualTemplate>,
    @InjectRepository(ManifestToManifestTemplate)
    private readonly toManifestTemplateRepo: Repository<ManifestToManifestTemplate>,
    @InjectRepository(ManifestNotToManifestTemplate)
    private readonly notToManifestTemplateRepo: Repository<ManifestNotToManifestTemplate>,
    @InjectRepository(ManifestAlignmentTemplate)
    private readonly alignmentTemplateRepo: Repository<ManifestAlignmentTemplate>,
    @InjectRepository(ManifestInsightTemplate)
    private readonly insightTemplateRepo: Repository<ManifestInsightTemplate>,
    @InjectRepository(ManifestSummaryTemplate)
    private readonly summaryTemplateRepo: Repository<ManifestSummaryTemplate>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('🌱 Starting Manifestation Master Data Seeding...');
      await this.seedCategories();
      await this.seedSubcategories();
      await this.seedKeywords();
      await this.seedEnergyRules();
      await this.seedTemplates();
      this.logger.log('✅ Manifestation Master Data Seeding Complete!');
    } catch (error) {
      this.logger.error('❌ Error seeding manifestation data:', error);
    }
  }

  /**
   * Seed Categories
   */
  private async seedCategories() {
    const categories = [
      {
        slug: 'career',
        label: 'Career & Work',
        description: 'Professional growth, job opportunities, promotions, business success',
        is_active: true,
      },
      {
        slug: 'love',
        label: 'Love & Relationships',
        description: 'Romantic relationships, marriage, dating, soulmate connections',
        is_active: true,
      },
      {
        slug: 'relationship',
        label: 'Relationships',
        description: 'All types of relationships including family, friends, and romantic',
        is_active: true,
      },
      {
        slug: 'wealth',
        label: 'Wealth & Abundance',
        description: 'Financial prosperity, money, investments, financial freedom',
        is_active: true,
      },
      {
        slug: 'money',
        label: 'Money & Finance',
        description: 'Money, income, savings, financial stability',
        is_active: true,
      },
      {
        slug: 'health',
        label: 'Health & Wellbeing',
        description: 'Physical health, mental health, healing, fitness, wellness',
        is_active: true,
      },
      {
        slug: 'family',
        label: 'Family & Home',
        description: 'Family relationships, home harmony, family support',
        is_active: true,
      },
      {
        slug: 'friendship',
        label: 'Friendship & Social',
        description: 'Friends, community, social connections, networking',
        is_active: true,
      },
      {
        slug: 'self_growth',
        label: 'Self Growth & Development',
        description: 'Personal development, confidence, skills, learning, transformation',
        is_active: true,
      },
      {
        slug: 'spirituality',
        label: 'Spirituality & Enlightenment',
        description: 'Spiritual growth, meditation, prayer, divine connection, karma, dharma',
        is_active: true,
      },
      {
        slug: 'spiritual',
        label: 'Spiritual Practice',
        description: 'Spiritual practices, rituals, divine connection',
        is_active: true,
      },
      {
        slug: 'creativity',
        label: 'Creativity & Expression',
        description: 'Art, music, writing, creative talents, expression',
        is_active: true,
      },
      {
        slug: 'other',
        label: 'Other',
        description: 'Other manifestations that do not fit into specific categories',
        is_active: true,
      },
    ];

    for (const cat of categories) {
      const existing = await this.categoryRepo.findOne({ where: { slug: cat.slug } });
      if (!existing) {
        const newCategory = this.categoryRepo.create(cat);
        await this.categoryRepo.save(newCategory);
        this.logger.log(`✅ Created category: ${cat.label} (${cat.slug})`);
      } else {
        this.logger.debug(`⏭️  Category already exists: ${cat.slug}`);
      }
    }
  }

  /**
   * Seed Subcategories
   */
  private async seedSubcategories() {
    const subcategories = [
      // Career subcategories
      { category_slug: 'career', slug: 'job', label: 'Job Opportunities', description: 'Finding new job opportunities' },
      { category_slug: 'career', slug: 'promotion', label: 'Promotion', description: 'Career advancement and promotions' },
      { category_slug: 'career', slug: 'business', label: 'Business Success', description: 'Business growth and success' },
      { category_slug: 'career', slug: 'skills', label: 'Skills Development', description: 'Learning new skills for career' },
      { category_slug: 'career', slug: 'political', label: 'Political Career', description: 'Political positions and leadership' },
      
      // Love subcategories
      { category_slug: 'love', slug: 'romance', label: 'Romance', description: 'Romantic relationships' },
      { category_slug: 'love', slug: 'marriage', label: 'Marriage', description: 'Marriage and wedding' },
      { category_slug: 'love', slug: 'dating', label: 'Dating', description: 'Dating and relationships' },
      { category_slug: 'love', slug: 'soulmate', label: 'Soulmate', description: 'Finding soulmate' },
      
      // Wealth subcategories
      { category_slug: 'wealth', slug: 'money', label: 'Money', description: 'Financial abundance' },
      { category_slug: 'wealth', slug: 'financial_freedom', label: 'Financial Freedom', description: 'Achieving financial independence' },
      { category_slug: 'wealth', slug: 'investment', label: 'Investment', description: 'Investment success' },
      { category_slug: 'wealth', slug: 'prosperity', label: 'Prosperity', description: 'Overall prosperity' },
      
      // Health subcategories
      { category_slug: 'health', slug: 'fitness', label: 'Fitness', description: 'Physical fitness' },
      { category_slug: 'health', slug: 'healing', label: 'Healing', description: 'Physical or emotional healing' },
      { category_slug: 'health', slug: 'mental_health', label: 'Mental Health', description: 'Mental wellbeing' },
      { category_slug: 'health', slug: 'energy', label: 'Energy', description: 'Vitality and energy' },
    ];

    for (const subcat of subcategories) {
      const category = await this.categoryRepo.findOne({ where: { slug: subcat.category_slug } });
      if (!category) {
        this.logger.warn(`⚠️  Category not found for subcategory: ${subcat.category_slug}`);
        continue;
      }

      const existing = await this.subcategoryRepo.findOne({
        where: { slug: subcat.slug, category_id: category.id },
      });

      if (!existing) {
        const newSubcategory = this.subcategoryRepo.create({
          category_id: category.id,
          slug: subcat.slug,
          label: subcat.label,
          description: subcat.description,
          is_active: true,
        });
        await this.subcategoryRepo.save(newSubcategory);
        this.logger.log(`✅ Created subcategory: ${subcat.label} (${subcat.slug}) under ${subcat.category_slug}`);
      }
    }
  }

  /**
   * Seed Keywords for Category Detection
   */
  private async seedKeywords() {
    const keywordData = [
      // Career keywords
      {
        category_slug: 'career',
        keywords: [
          'career', 'job', 'work', 'employment', 'profession', 'occupation', 'position', 'role',
          'promotion', 'advancement', 'raise', 'salary', 'income', 'business', 'company', 'office',
          'cm', 'chief minister', 'minister', 'mp', 'mla', 'bureaucrat', 'government', 'political',
          'leader', 'leadership', 'executive', 'manager', 'director', 'ceo', 'entrepreneur',
          'skills', 'training', 'education', 'certification', 'degree', 'qualification',
        ],
        weight: 1,
      },
      // Love keywords
      {
        category_slug: 'love',
        keywords: [
          'love', 'romance', 'romantic', 'partner', 'boyfriend', 'girlfriend', 'husband', 'wife',
          'soulmate', 'dating', 'date', 'relationship', 'marriage', 'wedding', 'engaged',
          'fiancé', 'fiancée', 'spouse', 'couple', 'affection', 'intimacy', 'passion',
        ],
        weight: 1,
      },
      // Wealth keywords
      {
        category_slug: 'wealth',
        keywords: [
          'wealth', 'money', 'rich', 'prosperity', 'abundance', 'financial', 'finance', 'income',
          'salary', 'earnings', 'profit', 'investment', 'savings', 'assets', 'fortune',
          'financial freedom', 'financial independence', 'millionaire', 'billionaire',
        ],
        weight: 1,
      },
      // Health keywords
      {
        category_slug: 'health',
        keywords: [
          'health', 'healthy', 'fitness', 'wellness', 'wellbeing', 'healing', 'cure', 'recovery',
          'strength', 'energy', 'vitality', 'mental health', 'physical health', 'exercise',
          'diet', 'nutrition', 'meditation', 'yoga', 'therapy',
        ],
        weight: 1,
      },
      // Relationship keywords
      {
        category_slug: 'relationship',
        keywords: [
          'relationship', 'relationships', 'family', 'friend', 'friends', 'friendship',
          'connection', 'bond', 'harmony', 'peace', 'understanding', 'communication',
        ],
        weight: 1,
      },
      // Spirituality keywords
      {
        category_slug: 'spirituality',
        keywords: [
          'spiritual', 'spirituality', 'divine', 'god', 'prayer', 'meditation', 'enlightenment',
          'karma', 'dharma', 'soul', 'consciousness', 'awakening', 'transcendence',
        ],
        weight: 1,
      },
    ];

    for (const data of keywordData) {
      const category = await this.categoryRepo.findOne({ where: { slug: data.category_slug } });
      if (!category) {
        this.logger.warn(`⚠️  Category not found for keywords: ${data.category_slug}`);
        continue;
      }

      for (const keyword of data.keywords) {
        const existing = await this.keywordRepo.findOne({
          where: { keyword, category_id: category.id },
        });

        if (!existing) {
          const newKeyword = this.keywordRepo.create({
            keyword,
            category_id: category.id,
            subcategory_id: null,
            weight: data.weight,
          });
          await this.keywordRepo.save(newKeyword);
        }
      }
      this.logger.log(`✅ Seeded ${data.keywords.length} keywords for category: ${data.category_slug}`);
    }
  }

  /**
   * Seed Energy Rules
   */
  private async seedEnergyRules() {
    const energyRules = [
      // Aligned energy patterns
      {
        energy_state: 'aligned',
        patterns: [
          'I have', 'I am', 'I will', 'I can', 'I know', 'I believe', 'I feel confident',
          'I am certain', 'I am ready', 'I am grateful', 'I am blessed', 'I am successful',
          'definitely', 'certainly', 'absolutely', 'surely', 'without doubt',
        ],
        weight: 10,
        description: 'Patterns indicating strong alignment and certainty',
      },
      // Scattered energy patterns
      {
        energy_state: 'scattered',
        patterns: [
          'maybe', 'perhaps', 'might', 'could', 'possibly', 'hopefully', 'wish',
          'I hope', 'I wish', 'I want', 'I need', 'I would like', 'I think',
          'uncertain', 'unsure', 'confused', 'unclear',
        ],
        weight: 8,
        description: 'Patterns indicating scattered or uncertain energy',
      },
      // Blocked energy patterns
      {
        energy_state: 'blocked',
        patterns: [
          'cannot', 'can\'t', 'unable', 'impossible', 'never', 'always fail', 'too hard',
          'blocked', 'stuck', 'limited', 'restricted', 'barrier', 'obstacle',
          'I cannot', 'I can\'t', 'I am unable', 'it is impossible',
        ],
        weight: 9,
        description: 'Patterns indicating blocked or limited energy',
      },
      // Doubtful energy patterns
      {
        energy_state: 'doubtful',
        patterns: [
          'doubt', 'doubtful', 'not sure', 'uncertain', 'question', 'worry', 'anxiety',
          'I doubt', 'I am not sure', 'I worry', 'I am anxious', 'I fear',
          'what if', 'but', 'however', 'although',
        ],
        weight: 7,
        description: 'Patterns indicating doubt or worry',
      },
      // Burned out energy patterns
      {
        energy_state: 'burned_out',
        patterns: [
          'tired', 'exhausted', 'drained', 'burned out', 'overwhelmed', 'stressed',
          'I am tired', 'I am exhausted', 'I am drained', 'I am overwhelmed',
          'too much', 'can\'t handle', 'giving up', 'losing hope',
        ],
        weight: 8,
        description: 'Patterns indicating burnout or exhaustion',
      },
    ];

    for (const rule of energyRules) {
      for (const pattern of rule.patterns) {
        const existing = await this.energyRuleRepo.findOne({
          where: { energy_state: rule.energy_state, pattern },
        });

        if (!existing) {
          const newRule = this.energyRuleRepo.create({
            energy_state: rule.energy_state,
            pattern,
            weight: rule.weight,
            description: rule.description,
          });
          await this.energyRuleRepo.save(newRule);
        }
      }
      this.logger.log(`✅ Seeded ${rule.patterns.length} patterns for energy state: ${rule.energy_state}`);
    }
  }

  /**
   * Seed Templates
   */
  private async seedTemplates() {
    // Get categories for template assignment
    const careerCategory = await this.categoryRepo.findOne({ where: { slug: 'career' } });
    const loveCategory = await this.categoryRepo.findOne({ where: { slug: 'love' } });
    const wealthCategory = await this.categoryRepo.findOne({ where: { slug: 'wealth' } });
    const healthCategory = await this.categoryRepo.findOne({ where: { slug: 'health' } });

    // Seed Ritual Templates
    await this.seedRitualTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);

    // Seed To Manifest Templates
    await this.seedToManifestTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);

    // Seed Not To Manifest Templates
    await this.seedNotToManifestTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);

    // Seed Alignment Templates
    await this.seedAlignmentTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);

    // Seed Insight Templates
    await this.seedInsightTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);

    // Seed Summary Templates
    await this.seedSummaryTemplates(careerCategory, loveCategory, wealthCategory, healthCategory);
  }

  private async seedRitualTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Visualize yourself in your desired {{position}} role, feeling confident and successful.',
        priority: 1,
      },
      {
        category: career,
        template_text: 'Write down your career goals daily and affirm: "I am attracting the perfect {{opportunity}}."',
        priority: 2,
      },
      {
        category: love,
        template_text: 'Practice self-love daily: "I am worthy of love and attracting my perfect partner."',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Express gratitude for current abundance: "I am grateful for the wealth flowing into my life."',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Affirm daily: "My body is healing and becoming stronger every day."',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.ritualTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.ritualTemplateRepo.create({
          category_id: template.category.id,
          subcategory_id: null,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.ritualTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded ritual templates`);
  }

  private async seedToManifestTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Focus on: Professional growth, skill development, and taking aligned action towards your {{goal}}.',
        priority: 1,
      },
      {
        category: love,
        template_text: 'Focus on: Self-love, open communication, and being ready to receive love.',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Focus on: Abundance mindset, gratitude, and opportunities for financial growth.',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Focus on: Healing, self-care, and positive lifestyle changes.',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.toManifestTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.toManifestTemplateRepo.create({
          category_id: template.category.id,
          subcategory_id: null,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.toManifestTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded to-manifest templates`);
  }

  private async seedNotToManifestTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Avoid: Doubting your abilities, comparing yourself to others, or focusing on limitations.',
        priority: 1,
      },
      {
        category: love,
        template_text: 'Avoid: Desperation, settling for less, or closing your heart to possibilities.',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Avoid: Scarcity mindset, fear of loss, or negative beliefs about money.',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Avoid: Negative self-talk about your body, ignoring symptoms, or unhealthy habits.',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.notToManifestTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.notToManifestTemplateRepo.create({
          category_id: template.category.id,
          subcategory_id: null,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.notToManifestTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded not-to-manifest templates`);
  }

  private async seedAlignmentTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Align your thoughts with: "I am capable and deserving of success in my {{field}}."',
        priority: 1,
      },
      {
        category: love,
        template_text: 'Align your thoughts with: "I am open to giving and receiving love."',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Align your thoughts with: "Abundance flows to me naturally and easily."',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Align your thoughts with: "My body is strong, healthy, and healing."',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.alignmentTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.alignmentTemplateRepo.create({
          category_id: template.category.id,
          subcategory_id: null,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.alignmentTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded alignment templates`);
  }

  private async seedInsightTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Your {{category}} manifestation shows {{energy_state}} energy. Focus on building confidence and taking consistent action.',
        priority: 1,
      },
      {
        category: love,
        template_text: 'Your {{category}} manifestation shows {{energy_state}} energy. Practice self-love and stay open to possibilities.',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Your {{category}} manifestation shows {{energy_state}} energy. Cultivate an abundance mindset and gratitude.',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Your {{category}} manifestation shows {{energy_state}} energy. Focus on self-care and positive lifestyle changes.',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.insightTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.insightTemplateRepo.create({
          category_id: template.category.id,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.insightTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded insight templates`);
  }

  private async seedSummaryTemplates(career: any, love: any, wealth: any, health: any) {
    const templates = [
      {
        category: career,
        template_text: 'Your {{category}} manifestation is currently {{energy_state}}. Focus on {{main_focus}}.',
        priority: 1,
      },
      {
        category: love,
        template_text: 'Your {{category}} manifestation is currently {{energy_state}}. Focus on {{main_focus}}.',
        priority: 1,
      },
      {
        category: wealth,
        template_text: 'Your {{category}} manifestation is currently {{energy_state}}. Focus on {{main_focus}}.',
        priority: 1,
      },
      {
        category: health,
        template_text: 'Your {{category}} manifestation is currently {{energy_state}}. Focus on {{main_focus}}.',
        priority: 1,
      },
    ];

    for (const template of templates) {
      if (!template.category) continue;

      const existing = await this.summaryTemplateRepo.findOne({
        where: {
          category_id: template.category.id,
          template_text: template.template_text,
        },
      });

      if (!existing) {
        const newTemplate = this.summaryTemplateRepo.create({
          category_id: template.category.id,
          template_text: template.template_text,
          priority: template.priority,
          is_active: true,
        });
        await this.summaryTemplateRepo.save(newTemplate);
      }
    }
    this.logger.log(`✅ Seeded summary templates`);
  }
}






