import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { KarmaCategory } from '../entities/karma-category.entity';
import { KarmaWeightRule } from '../entities/karma-weight-rule.entity';
import { PromptService } from '../../common/ai/prompt.service';
import { ConstantsService } from '../../common/constants/constants.service';

export interface AIClassificationResult {
  type: 'good' | 'bad' | 'neutral';
  confidence: number; // 0-100
  emotion: string; // e.g., 'anger', 'kindness', 'laziness'
  category: string; // e.g., 'behavioral', 'social', 'personal'
  weight: number; // Calculated weight based on rules
  habit_recommendation: string[]; // Suggested habits
  pattern_key: string; // Key for pattern matching
  reasoning: string; // Why this classification was made
}

@Injectable()
export class AIClassificationService {
  private readonly logger = new Logger(AIClassificationService.name);
  private readonly useLLM: boolean;
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(
    @InjectRepository(KarmaCategory)
    private readonly categoryRepository: Repository<KarmaCategory>,
    @InjectRepository(KarmaWeightRule)
    private readonly weightRuleRepository: Repository<KarmaWeightRule>,
    private readonly promptService: PromptService,
    private readonly constantsService: ConstantsService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.useLLM = !!this.openaiApiKey;
    
    if (!this.useLLM) {
      this.logger.warn('LLM API key not found. Karma classification will use rule-based fallback only.');
    }
  }

  /**
   * Classify an action using AI logic (rule-based + keyword matching)
   * Uses LLM if available, otherwise falls back to rule-based classification
   */
  async classifyAction(
    actionText: string,
    userId?: number,
  ): Promise<AIClassificationResult> {
    const normalizedText = actionText.toLowerCase().trim();

    // Get all active weight rules
    const weightRules = await this.weightRuleRepository.find({
      where: { is_active: true },
    });

    // Find matching pattern based on keywords
    let matchedRule: KarmaWeightRule | null = null;
    let bestMatchScore = 0;

    for (const rule of weightRules) {
      if (rule.keywords && rule.keywords.length > 0) {
        const matchCount = rule.keywords.filter((keyword) =>
          normalizedText.includes(keyword.toLowerCase()),
        ).length;
        const matchScore = matchCount / rule.keywords.length;

        if (matchScore > bestMatchScore && matchScore > 0.3) {
          bestMatchScore = matchScore;
          matchedRule = rule;
        }
      }
    }

    // If no rule matched, use AI-based classification
    if (!matchedRule) {
      return this.classifyWithAI(normalizedText, userId);
    }

    // Calculate weight (no intensity multiplier)
    const calculatedWeight = Number(matchedRule.base_weight);

    // Get habit recommendations for this pattern
    const habitRecommendations = await this.getHabitRecommendations(matchedRule.pattern_key);

    // Calculate confidence based on keyword match
    const confidence = Math.min(100, Math.round(bestMatchScore * 100 + 50));

    return {
      type: matchedRule.karma_type,
      confidence,
      emotion: matchedRule.pattern_key,
      category: matchedRule.category_slug,
      weight: calculatedWeight,
      habit_recommendation: habitRecommendations,
      pattern_key: matchedRule.pattern_key,
      reasoning: `Matched pattern "${matchedRule.pattern_name}" based on keyword analysis with ${Math.round(bestMatchScore * 100)}% match.`,
    };
  }

  /**
   * Fallback AI classification when no rule matches
   * Uses LLM if available, otherwise falls back to rule-based sentiment analysis
   */
  private async classifyWithAI(
    text: string,
    userId?: number,
  ): Promise<AIClassificationResult> {
    // Try LLM classification first if available
    if (this.useLLM) {
      try {
        return await this.classifyWithLLM(text, userId);
      } catch (error) {
        this.logger.warn('LLM classification failed, using rule-based fallback', error);
      }
    }

    // Fallback to rule-based classification using ConstantsService
    return await this.classifyWithRules(text);
  }

  /**
   * Classify using LLM (database-driven prompts)
   */
  private async classifyWithLLM(
    text: string,
    userId?: number,
  ): Promise<AIClassificationResult> {
    // Get prompts from database (database-driven, no hardcoded prompts)
    const systemPrompt = await this.promptService.getPrompt(
      'karma.classification.system.gpt5.1',
      {}
    );

    const userPrompt = await this.promptService.getPrompt(
      'karma.classification.user.gpt5.1',
      {
        action_text: text,
        user_id: userId?.toString() || 'unknown',
        current_date: new Date().toISOString().split('T')[0],
      }
    );

    // Call LLM
    const response = await this.callLLM(systemPrompt.finalText, userPrompt.finalText);
    
    // Parse response
    const classification = JSON.parse(response);
    
    // Get habit recommendations
    const habitRecommendations = await this.getHabitRecommendations(classification.pattern_key || classification.emotion);

    return {
      type: classification.type || 'neutral',
      confidence: Math.round((classification.confidence || 0.5) * 100),
      emotion: classification.emotion || 'neutral',
      category: classification.category || 'general',
      weight: classification.weight || 0,
      habit_recommendation: habitRecommendations,
      pattern_key: classification.pattern_key || classification.emotion || 'neutral',
      reasoning: classification.reasoning || 'LLM classification',
    };
  }

  /**
   * Rule-based classification using ConstantsService (no hardcoded keywords)
   */
  private async classifyWithRules(text: string): Promise<AIClassificationResult> {
    // Get keywords from ConstantsService (database-driven, no hardcoded words)
    // Note: We'll need to add karma-specific constants, for now use manifestation keywords as fallback
    const positiveKeywords = await this.constantsService.getPositiveKeywords();
    const negativeKeywords = await this.constantsService.getNegativeKeywords();

    const positiveCount = positiveKeywords.filter((kw) => text.includes(kw.toLowerCase())).length;
    const negativeCount = negativeKeywords.filter((kw) => text.includes(kw.toLowerCase())).length;

    let type: 'good' | 'bad' | 'neutral' = 'neutral';
    let confidence = 50;
    let emotion = 'neutral';
    let weight = 0;

    if (positiveCount > negativeCount && positiveCount > 0) {
      type = 'good';
      confidence = Math.min(100, 60 + positiveCount * 10);
      emotion = this.detectEmotion(text, 'positive');
      weight = 10 + positiveCount * 5;
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      type = 'bad';
      confidence = Math.min(100, 60 + negativeCount * 10);
      emotion = this.detectEmotion(text, 'negative');
      weight = -(10 + negativeCount * 5);
    }

    const habitRecommendations = await this.getHabitRecommendations(emotion);

    return {
      type,
      confidence,
      emotion,
      category: 'general',
      weight,
      habit_recommendation: habitRecommendations,
      pattern_key: emotion,
      reasoning: `Rule-based classification: ${positiveCount} positive indicators, ${negativeCount} negative indicators.`,
    };
  }

  /**
   * Call LLM API for classification
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const apiUrl = `${this.openaiBaseUrl}/chat/completions`;

    const requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    };

    const response = await firstValueFrom(
      this.httpService.post(apiUrl, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })
    );

    return response.data.choices[0]?.message?.content || '{}';
  }

  /**
   * Detect emotional tone from text
   */
  private detectEmotion(text: string, sentiment: 'positive' | 'negative'): string {
    if (sentiment === 'positive') {
      if (text.includes('help') || text.includes('support')) return 'kindness';
      if (text.includes('learn') || text.includes('study')) return 'discipline';
      if (text.includes('donate') || text.includes('give')) return 'generosity';
      if (text.includes('meditate') || text.includes('mindful')) return 'mindfulness';
      return 'kindness';
    } else {
      if (text.includes('anger') || text.includes('angry') || text.includes('rage')) return 'anger';
      if (text.includes('lazy') || text.includes('procrastinate')) return 'laziness';
      if (text.includes('lie') || text.includes('cheat') || text.includes('dishonest'))
        return 'dishonesty';
      if (text.includes('selfish') || text.includes('greed')) return 'ego';
      return 'negative';
    }
  }

  /**
   * Get habit recommendations for a pattern
   */
  private async getHabitRecommendations(patternKey: string): Promise<string[]> {
    // This will be enhanced when we have the habit suggestion repository
    const defaultHabits: Record<string, string[]> = {
      anger: [
        'Daily meditation 10 mins',
        'Pause before reacting',
        'Journaling before sleep',
      ],
      laziness: [
        'Pomodoro technique',
        'Morning routine setup',
        'Daily task list at night',
      ],
      dishonesty: [
        'Truth journaling',
        'Mindfulness check-in',
        'Accountability partner',
      ],
      kindness: [
        'Daily act of kindness',
        'Volunteer weekly',
        'Express gratitude daily',
      ],
      discipline: [
        'Morning routine',
        'Time blocking',
        'Goal setting',
      ],
    };

    return defaultHabits[patternKey] || ['Daily mindfulness practice', 'Reflection journaling'];
  }
}

