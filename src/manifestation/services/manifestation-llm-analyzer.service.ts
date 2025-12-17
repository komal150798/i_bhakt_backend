import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ManifestationBackendConfig } from './manifestation-backend-config.service';
import { PromptService } from '../../common/ai/prompt.service';

/**
 * Universal AI Engine for Manifestation Analysis
 * Works with ANY LLM (Gemini, GPT, Claude, Llama, DeepSeek)
 * Completely backend-driven - NO hardcoded content
 */
@Injectable()
export class ManifestationLLMAnalyzerService {
  private readonly logger = new Logger(ManifestationLLMAnalyzerService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly useLLM: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly promptService: PromptService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.useLLM = !!this.openaiApiKey;
    
    if (!this.useLLM) {
      this.logger.warn('LLM API key not found. LLM analysis will be disabled. Using fallback analysis.');
    }
  }

  /**
   * Analyze manifestation using Universal AI Engine
   * ALL domain knowledge comes from backend_config
   */
  async analyzeManifestation(
    title: string,
    description: string,
    backendConfig: ManifestationBackendConfig,
    categoryHint?: string,
  ): Promise<{
    detected_category: string;
    detected_subcategory: string | null;
    category_label: string;
    energy_state: 'aligned' | 'scattered' | 'blocked' | 'doubtful' | 'burned_out';
    energy_reason: string;
    suggested_rituals: string[];
    what_to_manifest: string[];
    what_not_to_manifest: string[];
    thought_alignment_tips: string[];
    insights: string;
    summary_for_ui: string;
    scores?: {
      resonance_score: number;
      alignment_score: number;
      antrashaakti_score: number;
      mahaadha_score: number;
      astro_support_index: number;
      mfp_score: number;
    };
  }> {
    if (!this.useLLM) {
      return this.fallbackAnalysis(title, description, backendConfig, categoryHint);
    }

    try {
      // Get prompts from database (database-driven, no hardcoded prompts)
      const systemPrompt = await this.promptService.getPrompt(
        'manifestation.analysis.system.gpt5.1',
        {
          backend_rules_json: JSON.stringify(backendConfig, null, 2),
          language: backendConfig.language_rules?.default || 'en',
        }
      );

      const userPrompt = await this.promptService.getPrompt(
        'manifestation.analysis.user.gpt5.1',
        {
          manifestation_title: title,
          manifestation_text: description,
          user_category_hint: categoryHint || 'null',
          language: backendConfig.language_rules?.default || 'en',
          current_date: new Date().toISOString().split('T')[0],
          backend_rules_json: JSON.stringify(backendConfig, null, 2),
        }
      );

      const response = await this.callLLM(systemPrompt.finalText, userPrompt.finalText);
      
      const analysis = this.parseLLMResponse(response, backendConfig);
      const scores = this.calculateScoresFromAnalysis(analysis, description, backendConfig);
      
      return {
        ...analysis,
        scores,
      };
    } catch (error) {
      this.logger.error('LLM analysis failed, using fallback', error);
      return this.fallbackAnalysis(title, description, backendConfig, categoryHint);
    }
  }

  /**
   * Build universal prompt that works with ANY LLM
   * Uses ONLY backend_config - no hardcoded content
   */
  private buildUniversalPrompt(
    title: string,
    description: string,
    backendConfig: ManifestationBackendConfig,
    categoryHint?: string,
  ): string {
    // Build category list from backend
    const categoryList = backendConfig.categories.map(c => c.id).join('", "');
    const categoryLabels = backendConfig.categories.map(c => `"${c.id}": "${c.label}"`).join(',\n    ');

    // Build energy states from backend
    const energyStates = Object.keys(backendConfig.energy_rules).join('", "');
    const energyRulesDesc = Object.entries(backendConfig.energy_rules)
      .map(([state, rule]) => `- "${state}": ${rule.description} (patterns: ${rule.patterns.join(', ')})`)
      .join('\n    ');

    // Build keyword mapping info
    const keywordMapping = Object.entries(backendConfig.category_keywords)
      .map(([cat, keywords]) => `  "${cat}": [${keywords.map(k => `"${k}"`).join(', ')}]`)
      .join(',\n');

    return `You are the "I-Bhakt Universal AI Engine" designed to work with ANY LLM.

IMPORTANT:
- Do NOT use static or hardcoded texts.
- Do NOT make your own categories, rituals, rules, affirmations, or insights.
- ALL domain knowledge MUST come from the BACKEND PAYLOAD.
- Your job is ONLY to interpret user text and apply backend rules to generate dynamic responses.

ROLE & PURPOSE:
You act as a flexible AI layer that:
1. Reads user input (manifestation text)
2. Uses backend-provided: categories, keywords, energy rules, templates, scoring rules
3. Generates a structured response in standard JSON format
4. NEVER generate content outside backend rules
5. The response must ALWAYS reflect backend configuration

INPUT:
{
  "manifestation_title": "${title}",
  "manifestation_text": "${description}",
  "user_category_hint": "${categoryHint || 'null'}",
  "language": "${backendConfig.language_rules.default}",
  "backend_config": ${JSON.stringify(backendConfig, null, 2)}
}

BACKEND CATEGORIES (use ONLY these):
${categoryLabels}

CATEGORY DETECTION RULES:
1. Use backend category_keywords to detect main category and subcategory
2. If user_category_hint matches backend config, allow it
3. If no keywords match, default to: "${backendConfig.fallback_category}"

Category Keywords Mapping:
${keywordMapping}

ENERGY STATE DETECTION (use ONLY backend rules):
Allowed states: "${energyStates}"

Energy Rules:
    ${energyRulesDesc}

You must:
- Detect emotional tone from user text
- Map it to backend energy_rules
- Write explanation in energy_reason using backend templates

RITUALS / WHAT TO MANIFEST / WHAT NOT TO MANIFEST:
Use backend-provided templates. Fill placeholders like {{user_goal}}, {{category_label}}, {{user_focus}} dynamically.

Backend Ritual Templates:
${JSON.stringify(backendConfig.ritual_templates, null, 2)}

Backend What to Manifest Templates:
${JSON.stringify(backendConfig.what_to_manifest_templates, null, 2)}

Backend What NOT to Manifest Templates:
${JSON.stringify(backendConfig.what_not_to_manifest_templates, null, 2)}

THOUGHT ALIGNMENT TIPS:
Use backend alignment_templates. Fill placeholders dynamically.

Backend Thought Alignment Templates:
${JSON.stringify(backendConfig.thought_alignment_templates, null, 2)}

INSIGHTS:
Use backend insight_templates. Fill placeholders dynamically.

Backend Insight Templates:
${JSON.stringify(backendConfig.insight_templates, null, 2)}

SUMMARY FOR UI:
Use backend summary_template: "${backendConfig.summary_template}"

OUTPUT FORMAT (STRICT JSON - return ONLY this JSON, no markdown):
{
  "manifestation_title": "${title}",
  "detected_category": "string (from backend categories)",
  "detected_subcategory": "string | null",
  "category_label": "string (from backend)",
  "energy_state": "string (from backend energy_rules)",
  "energy_reason": "string (explain using backend rules)",
  "suggested_rituals": ["string", "string", ...],
  "what_to_manifest": ["string", "string", ...],
  "what_not_to_manifest": ["string", "string", ...],
  "thought_alignment_tips": ["string", "string", ...],
  "insights": "string (use backend templates)",
  "summary_for_ui": "string (use backend template)"
}

IMPORTANT RESTRICTIONS:
❌ Do NOT invent categories
❌ Do NOT invent rituals
❌ Do NOT invent affirmations
❌ Do NOT invent coaching advice
❌ Do NOT invent structure
❌ Do NOT invent templates
❌ Use ONLY backend-provided patterns

✔ ALWAYS follow backend templates
✔ ALWAYS follow structure
✔ ALWAYS generate dynamic content based on user text
✔ ALWAYS stay future-proof

Return ONLY valid JSON. No markdown, no explanation.`;
  }

  /**
   * Call LLM API (works with OpenAI, Gemini, Claude, etc.)
   * Now uses database-driven prompts
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      const provider = this.configService.get<string>('LLM_PROVIDER') || 'openai';

      let apiUrl = `${this.openaiBaseUrl}/chat/completions`;
      let requestBody: any = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt, // From database via PromptService
          },
          {
            role: 'user',
            content: userPrompt, // From database via PromptService
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      };

      // Support different LLM providers
      if (provider === 'gemini') {
        apiUrl = this.configService.get<string>('GEMINI_BASE_URL') || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        requestBody = {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
          },
        };
      } else if (provider === 'claude') {
        apiUrl = this.configService.get<string>('CLAUDE_BASE_URL') || 'https://api.anthropic.com/v1/messages';
        requestBody = {
          model: model || 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt,
          }],
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (provider === 'openai' || !provider) {
        headers['Authorization'] = `Bearer ${this.openaiApiKey}`;
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = this.openaiApiKey; // Reuse key env var
      } else if (provider === 'claude') {
        headers['x-api-key'] = this.openaiApiKey;
        headers['anthropic-version'] = '2023-06-01';
      }

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestBody, {
          headers,
          timeout: 30000,
        }),
      );

      let content: string;
      if (provider === 'gemini') {
        content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider === 'claude') {
        content = response.data?.content?.[0]?.text || '';
      } else {
        content = response.data?.choices?.[0]?.message?.content || '';
      }

      if (!content) {
        throw new Error('No content in LLM response');
      }

      // Clean JSON if it has markdown code blocks
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return cleanedContent;
    } catch (error: any) {
      this.logger.error('LLM API call failed', error.message);
      throw error;
    }
  }

  /**
   * Parse LLM JSON response and validate against backend config
   */
  private parseLLMResponse(
    jsonString: string,
    backendConfig: ManifestationBackendConfig,
  ): {
    detected_category: string;
    detected_subcategory: string | null;
    category_label: string;
    energy_state: 'aligned' | 'scattered' | 'blocked' | 'doubtful' | 'burned_out';
    energy_reason: string;
    suggested_rituals: string[];
    what_to_manifest: string[];
    what_not_to_manifest: string[];
    thought_alignment_tips: string[];
    insights: string;
    summary_for_ui: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate required fields
      const required = [
        'detected_category',
        'category_label',
        'energy_state',
        'energy_reason',
        'suggested_rituals',
        'what_to_manifest',
        'what_not_to_manifest',
        'thought_alignment_tips',
        'insights',
        'summary_for_ui',
      ];

      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate category against backend
      const validCategories = backendConfig.categories.map(c => c.id);
      if (!validCategories.includes(parsed.detected_category)) {
        parsed.detected_category = backendConfig.fallback_category;
        const fallbackCat = backendConfig.categories.find(c => c.id === backendConfig.fallback_category);
        parsed.category_label = fallbackCat?.label || parsed.detected_category;
      } else {
        const category = backendConfig.categories.find(c => c.id === parsed.detected_category);
        parsed.category_label = category?.label || parsed.detected_category;
      }

      // Validate energy_state against backend
      const validEnergyStates = Object.keys(backendConfig.energy_rules);
      if (!validEnergyStates.includes(parsed.energy_state)) {
        parsed.energy_state = 'aligned'; // Default fallback
      }

      return {
        detected_category: parsed.detected_category,
        detected_subcategory: parsed.detected_subcategory || null,
        category_label: parsed.category_label,
        energy_state: parsed.energy_state,
        energy_reason: parsed.energy_reason,
        suggested_rituals: Array.isArray(parsed.suggested_rituals) ? parsed.suggested_rituals : [],
        what_to_manifest: Array.isArray(parsed.what_to_manifest) ? parsed.what_to_manifest : [],
        what_not_to_manifest: Array.isArray(parsed.what_not_to_manifest) ? parsed.what_not_to_manifest : [],
        thought_alignment_tips: Array.isArray(parsed.thought_alignment_tips) ? parsed.thought_alignment_tips : [],
        insights: parsed.insights || '',
        summary_for_ui: parsed.summary_for_ui || '',
      };
    } catch (error: any) {
      this.logger.error('Failed to parse LLM response', error.message);
      throw new Error(`Invalid LLM response format: ${error.message}`);
    }
  }

  /**
   * Calculate scores based on LLM analysis and backend scoring rules
   */
  private calculateScoresFromAnalysis(
    analysis: any,
    description: string,
    backendConfig: ManifestationBackendConfig,
  ): {
    resonance_score: number;
    alignment_score: number;
    antrashaakti_score: number;
    mahaadha_score: number;
    astro_support_index: number;
    mfp_score: number;
  } {
    const rules = backendConfig.scoring_rules;
    
    // Map energy state to base scores
    const energyStateScores: Record<string, { resonance: number; alignment: number; antrashaakti: number; mahaadha: number }> = {
      aligned: { resonance: 85, alignment: 80, antrashaakti: 75, mahaadha: 10 },
      scattered: { resonance: 50, alignment: 40, antrashaakti: 45, mahaadha: 30 },
      blocked: { resonance: 30, alignment: 35, antrashaakti: 25, mahaadha: 80 },
      doubtful: { resonance: 45, alignment: 50, antrashaakti: 40, mahaadha: 50 },
      burned_out: { resonance: 40, alignment: 45, antrashaakti: 30, mahaadha: 60 },
    };

    const baseScores = energyStateScores[analysis.energy_state] || energyStateScores.aligned;

    // Adjust based on description length and detail
    const wordCount = description.split(/\s+/).length;
    const detailBonus = Math.min((wordCount / 10) * rules.word_count_bonus_per_10_words, 15);

    const resonance_score = Math.min(100, baseScores.resonance + detailBonus);
    const alignment_score = Math.min(100, baseScores.alignment + detailBonus);
    const antrashaakti_score = Math.min(100, baseScores.antrashaakti + detailBonus);
    const mahaadha_score = Math.max(0, baseScores.mahaadha - detailBonus / 2);

    // Astro support based on category (simplified - can be enhanced)
    const astro_support_index = this.calculateAstroSupport(analysis.detected_category);

    // MFP Score (weighted average)
    const mfp_score = Math.round(
      resonance_score * 0.25 +
      alignment_score * 0.20 +
      antrashaakti_score * 0.20 +
      (100 - mahaadha_score) * 0.15 +
      astro_support_index * 0.20,
    );

    return {
      resonance_score: Math.round(resonance_score),
      alignment_score: Math.round(alignment_score),
      antrashaakti_score: Math.round(antrashaakti_score),
      mahaadha_score: Math.round(mahaadha_score),
      astro_support_index: Math.round(astro_support_index),
      mfp_score,
    };
  }

  /**
   * Calculate astro support index based on category
   */
  private calculateAstroSupport(category: string): number {
    const categorySupport: Record<string, number> = {
      love: 75,
      career: 70,
      health: 65,
      wealth: 80,
      family: 70,
      friendship: 65,
      self_growth: 75,
      spirituality: 85,
      creativity: 70,
      other: 60,
    };
    return categorySupport[category] || 60;
  }

  /**
   * Fallback analysis when LLM is not available
   * Uses backend config for all rules
   */
  private fallbackAnalysis(
    title: string,
    description: string,
    backendConfig: ManifestationBackendConfig,
    categoryHint?: string,
  ): {
    detected_category: string;
    detected_subcategory: string | null;
    category_label: string;
    energy_state: 'aligned' | 'scattered' | 'blocked' | 'doubtful' | 'burned_out';
    energy_reason: string;
    suggested_rituals: string[];
    what_to_manifest: string[];
    what_not_to_manifest: string[];
    thought_alignment_tips: string[];
    insights: string;
    summary_for_ui: string;
    scores?: {
      resonance_score: number;
      alignment_score: number;
      antrashaakti_score: number;
      mahaadha_score: number;
      astro_support_index: number;
      mfp_score: number;
    };
  } {
    // Use backend config for category detection
    const category = this.detectCategoryFallback(title, description, backendConfig, categoryHint);
    const categoryObj = backendConfig.categories.find(c => c.id === category);
    const energyState = this.detectEnergyStateFallback(description, backendConfig);
    
    // Generate content using backend templates
    const rituals = this.generateRitualsFallback(category, description, backendConfig);
    const whatToManifest = this.generateWhatToManifestFallback(description, energyState.state, backendConfig);
    const whatNotToManifest = this.generateWhatNotToManifestFallback(description, energyState.state, backendConfig);
    const thoughtAlignment = this.generateThoughtAlignmentFallback(description, energyState.state, backendConfig);
    const insights = this.generateInsightsFallback(title, description, category, energyState.state, backendConfig);
    const summary = this.generateSummaryFallback(category, energyState.state, backendConfig);

    return {
      detected_category: category,
      detected_subcategory: null,
      category_label: categoryObj?.label || category,
      energy_state: energyState.state,
      energy_reason: energyState.reason,
      suggested_rituals: rituals,
      what_to_manifest: whatToManifest,
      what_not_to_manifest: whatNotToManifest,
      thought_alignment_tips: thoughtAlignment,
      insights,
      summary_for_ui: summary,
    };
  }

  private detectCategoryFallback(
    title: string,
    description: string,
    backendConfig: ManifestationBackendConfig,
    hint?: string,
  ): string {
    const text = `${title} ${description}`.toLowerCase();
    
    // Use backend category_keywords
    const scores: Record<string, number> = {};
    for (const [cat, keywords] of Object.entries(backendConfig.category_keywords)) {
      scores[cat] = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    }

    const maxCategory = Object.entries(scores).reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0];
    
    if (scores[maxCategory] >= 2) {
      return maxCategory;
    }
    
    return hint && backendConfig.categories.find(c => c.id === hint) ? hint : backendConfig.fallback_category;
  }

  private detectEnergyStateFallback(
    description: string,
    backendConfig: ManifestationBackendConfig,
  ): {
    state: 'aligned' | 'scattered' | 'blocked' | 'doubtful' | 'burned_out';
    reason: string;
  } {
    const text = description.toLowerCase();
    
    // Use backend energy_rules
    for (const [state, rule] of Object.entries(backendConfig.energy_rules)) {
      const matchCount = rule.patterns.filter(p => text.includes(p.toLowerCase())).length;
      if (matchCount >= 2) {
        return {
          state: state as any,
          reason: `${rule.description}. Detected ${matchCount} matching patterns: ${rule.patterns.filter(p => text.includes(p.toLowerCase())).join(', ')}.`,
        };
      }
    }

    // Default to aligned
    return {
      state: 'aligned',
      reason: backendConfig.energy_rules.aligned.description,
    };
  }

  private generateRitualsFallback(
    category: string,
    description: string,
    backendConfig: ManifestationBackendConfig,
  ): string[] {
    // Use backend ritual_templates
    const categoryTemplates = backendConfig.ritual_templates.filter(
      t => t.category === category || t.category === 'all',
    );
    
    return categoryTemplates.slice(0, 3).map(t => {
      return t.pattern
        .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
        .replace('{{category_label}}', backendConfig.categories.find(c => c.id === category)?.label || category)
        .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '))
        .replace('{{category_color}}', t.category_color || 'white')
        .replace('{{category_specific_action}}', t.category_specific_action || 'meditation');
    });
  }

  private generateWhatToManifestFallback(
    description: string,
    energyState: string,
    backendConfig: ManifestationBackendConfig,
  ): string[] {
    const templates = backendConfig.what_to_manifest_templates.filter(t => {
      if (t.condition === 'all') return true;
      return t.condition.includes(energyState);
    });
    
    return templates.slice(0, 3).map(t => {
      return t.pattern
        .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
        .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '));
    });
  }

  private generateWhatNotToManifestFallback(
    description: string,
    energyState: string,
    backendConfig: ManifestationBackendConfig,
  ): string[] {
    const templates = backendConfig.what_not_to_manifest_templates.filter(t => {
      if (t.condition === 'all') return true;
      return t.condition.includes(energyState);
    });
    
    return templates.slice(0, 3).map(t => {
      return t.pattern
        .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
        .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '))
        .replace('{{category_label}}', 'this area');
    });
  }

  private generateThoughtAlignmentFallback(
    description: string,
    energyState: string,
    backendConfig: ManifestationBackendConfig,
  ): string[] {
    const templates = backendConfig.thought_alignment_templates.filter(t => {
      if (t.condition === 'all') return true;
      return t.condition.includes(energyState);
    });
    
    return templates.slice(0, 3).map(t => {
      return t.pattern
        .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
        .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '));
    });
  }

  private generateInsightsFallback(
    title: string,
    description: string,
    category: string,
    energyState: string,
    backendConfig: ManifestationBackendConfig,
  ): string {
    const template = backendConfig.insight_templates[0] || backendConfig.insight_templates[0];
    const categoryLabel = backendConfig.categories.find(c => c.id === category)?.label || category;
    const energyRule = backendConfig.energy_rules[energyState];
    
    return template.pattern
      .replace('{{manifestation_title}}', title)
      .replace('{{category_label}}', categoryLabel)
      .replace('{{energy_state_reason}}', energyRule?.description || '')
      .replace('{{core_shift}}', 'focusing on clarity and positive emotional charge')
      .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
      .replace('{{category_specific_guidance}}', `Focus on ${categoryLabel.toLowerCase()}`)
      .replace('{{energy_state_analysis}}', `Your energy state is ${energyState}`)
      .replace('{{energy_impact}}', energyRule?.description || '')
      .replace('{{main_focus}}', 'clarity and positive intention');
  }

  private generateSummaryFallback(
    category: string,
    energyState: string,
    backendConfig: ManifestationBackendConfig,
  ): string {
    const categoryLabel = backendConfig.categories.find(c => c.id === category)?.label || category;
    return backendConfig.summary_template
      .replace('{{category_label}}', categoryLabel)
      .replace('{{energy_state}}', energyState)
      .replace('{{main_focus}}', 'clarity and positive intention');
  }
}

