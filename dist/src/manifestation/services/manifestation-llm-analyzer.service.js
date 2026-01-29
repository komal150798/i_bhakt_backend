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
var ManifestationLLMAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestationLLMAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const prompt_service_1 = require("../../common/ai/prompt.service");
const text_normalizer_util_1 = require("../utils/text-normalizer.util");
let ManifestationLLMAnalyzerService = ManifestationLLMAnalyzerService_1 = class ManifestationLLMAnalyzerService {
    constructor(configService, httpService, promptService) {
        this.configService = configService;
        this.httpService = httpService;
        this.promptService = promptService;
        this.logger = new common_1.Logger(ManifestationLLMAnalyzerService_1.name);
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
        this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL') || '';
        this.geminiBaseUrl = this.configService.get('GEMINI_BASE_URL') || '';
        this.claudeBaseUrl = this.configService.get('CLAUDE_BASE_URL') || '';
        const provider = this.configService.get('LLM_PROVIDER') || 'openai';
        if (provider === 'openai' && !this.openaiBaseUrl) {
            this.logger.error('❌ OPENAI_BASE_URL is required in .env file');
        }
        else if (provider === 'gemini' && !this.geminiBaseUrl) {
            this.logger.error('❌ GEMINI_BASE_URL is required in .env file');
        }
        else if (provider === 'claude' && !this.claudeBaseUrl) {
            this.logger.error('❌ CLAUDE_BASE_URL is required in .env file');
        }
        const useLLMFlag = this.configService.get('USE_LLM');
        const hasApiKey = !!this.openaiApiKey;
        if (useLLMFlag !== undefined) {
            this.useLLM = useLLMFlag === 'true' || useLLMFlag === '1' || useLLMFlag === 'yes';
            if (this.useLLM && !hasApiKey) {
                this.logger.warn('⚠️ USE_LLM=true but OPENAI_API_KEY not found. LLM will fail.');
            }
        }
        else {
            this.useLLM = hasApiKey;
        }
        this.logger.log(`🔧 LLM Status: ${this.useLLM ? 'ENABLED' : 'DISABLED'} (USE_LLM=${useLLMFlag || 'auto'}, API_KEY=${hasApiKey ? 'present' : 'missing'})`);
        this.logger.log(`🔧 LLM URLs: OpenAI=${this.openaiBaseUrl ? '✅' : '❌'}, Gemini=${this.geminiBaseUrl ? '✅' : '❌'}, Claude=${this.claudeBaseUrl ? '✅' : '❌'}`);
        if (!this.useLLM) {
            this.logger.warn('📝 LLM analysis disabled. Using fallback analysis.');
        }
    }
    async analyzeManifestation(title, description, backendConfig, categoryHint) {
        if (!this.useLLM) {
            this.logger.log('📝 LLM disabled - using fallback analysis');
            return this.fallbackAnalysis(title, description, backendConfig, categoryHint);
        }
        this.logger.log('🤖 Starting LLM analysis...');
        this.logger.log(`📋 Input: title="${title}", description="${description.substring(0, 50)}..."`);
        try {
            this.logger.log('📥 Fetching prompts from database...');
            const systemPrompt = await this.promptService.getPrompt('manifestation.analysis.system.gpt5.1', {
                backend_config_json: JSON.stringify(backendConfig, null, 2),
                backend_rules_json: JSON.stringify(backendConfig, null, 2),
                language: backendConfig.language_rules?.default || 'en',
            });
            const userPrompt = await this.promptService.getPrompt('manifestation.analysis.user.gpt5.1', {
                manifestation_title: title,
                manifestation_text: description,
                user_category_hint: categoryHint || 'null',
                language: backendConfig.language_rules?.default || 'en',
                current_date: new Date().toISOString().split('T')[0],
                backend_config_json: JSON.stringify(backendConfig, null, 2),
                backend_rules_json: JSON.stringify(backendConfig, null, 2),
            });
            this.logger.log(`✅ Using System Prompt v${systemPrompt.version} (key: ${systemPrompt.key})`);
            this.logger.log(`✅ Using User Prompt v${userPrompt.version} (key: ${userPrompt.key})`);
            const categoriesCount = backendConfig.categories?.length || 0;
            const energyRulesCount = Object.keys(backendConfig.energy_rules || {}).length;
            const backendConfigSize = JSON.stringify(backendConfig).length;
            this.logger.log(`📊 Backend Config: ${categoriesCount} categories, ${energyRulesCount} energy rules, ${backendConfigSize} chars`);
            if (backendConfig.categories && backendConfig.categories.length > 0) {
                const categoryIds = backendConfig.categories.map(c => c.id).join(', ');
                this.logger.log(`📋 Available categories: ${categoryIds}`);
                const hasCareer = backendConfig.categories.some(c => c.id === 'career');
                if (!hasCareer) {
                    this.logger.warn('⚠️ "career" category not found in backend_config!');
                }
                else {
                    this.logger.log('✅ "career" category found in backend_config');
                }
            }
            else {
                this.logger.error('❌ No categories found in backend_config! This will cause category detection to fail.');
            }
            if (!backendConfig || typeof backendConfig !== 'object') {
                this.logger.error('❌ backend_config is invalid or empty!');
                throw new Error('Invalid backend_config provided to LLM analyzer');
            }
            this.logger.log(`📝 System Prompt preview: ${systemPrompt.template.substring(0, 150)}...`);
            this.logger.log(`📝 User Prompt finalText preview: ${systemPrompt.finalText.substring(0, 200)}...`);
            this.logger.log(`📝 User Prompt template preview: ${userPrompt.template.substring(0, 150)}...`);
            this.logger.log(`📝 User Prompt finalText preview: ${userPrompt.finalText.substring(0, 200)}...`);
            const backendConfigJson = JSON.stringify(backendConfig, null, 2);
            this.logger.debug(`📋 Backend Config JSON preview (first 500 chars): ${backendConfigJson.substring(0, 500)}...`);
            this.logger.log('🌐 Calling LLM API...');
            const response = await this.callLLM(systemPrompt.finalText, userPrompt.finalText);
            this.logger.log(`✅ LLM response received (${response.length} chars)`);
            this.logger.log('🔍 Parsing LLM response...');
            const analysis = this.parseLLMResponse(response, backendConfig);
            this.logger.log(`✅ Parsed: category="${analysis.detected_category}", energy="${analysis.energy_state}"`);
            this.logger.log(`📊 Analysis details: subcategory="${analysis.detected_subcategory || 'none'}", rituals=${analysis.suggested_rituals.length}, tips=${analysis.thought_alignment_tips.length}`);
            const lowerTitle = title.toLowerCase();
            const lowerDesc = description.toLowerCase();
            const careerKeywords = ['cm', 'chief minister', 'minister', 'career', 'job', 'position', 'promotion', 'office', 'political', 'government', 'election', 'mp', 'mla', 'bureaucrat'];
            const isCareerRelated = careerKeywords.some(keyword => lowerTitle.includes(keyword) || lowerDesc.includes(keyword));
            if (analysis.detected_category === 'other' && isCareerRelated) {
                const availableCategories = backendConfig.categories?.map(c => c.id).join(', ') || 'none';
                this.logger.warn(`⚠️ Category detection issue: Detected "other" for career-related text "${title}"`);
                this.logger.warn(`📋 Available categories: ${availableCategories}`);
                const careerCategory = backendConfig.categories?.find(c => c.id === 'career');
                if (careerCategory) {
                    this.logger.log(`🔧 Auto-correcting category from "other" to "career" based on content analysis`);
                    analysis.detected_category = 'career';
                    analysis.category_label = careerCategory.label || 'career';
                }
                else {
                    this.logger.error(`❌ "career" category not found in backend_config! Cannot auto-correct.`);
                }
            }
            const scores = this.calculateScoresFromAnalysis(analysis, description, backendConfig);
            this.logger.log(`✅ Scores calculated: resonance=${scores.resonance_score}, alignment=${scores.alignment_score}`);
            return {
                ...analysis,
                scores,
            };
        }
        catch (error) {
            this.logger.error('❌ LLM analysis failed, using fallback', error.message);
            this.logger.log('🔍 LLM error details:', {
                message: error.message,
                stack: error.stack?.substring(0, 200),
                apiKey: this.openaiApiKey ? 'present' : 'missing',
            });
            this.logger.log('📝 Falling back to rule-based analysis...');
            return this.fallbackAnalysis(title, description, backendConfig, categoryHint);
        }
    }
    buildUniversalPrompt(title, description, backendConfig, categoryHint) {
        const categoryList = backendConfig.categories.map(c => c.id).join('", "');
        const categoryLabels = backendConfig.categories.map(c => `"${c.id}": "${c.label}"`).join(',\n    ');
        const energyStates = Object.keys(backendConfig.energy_rules).join('", "');
        const energyRulesDesc = Object.entries(backendConfig.energy_rules)
            .map(([state, rule]) => `- "${state}": ${rule.description} (patterns: ${rule.patterns.join(', ')})`)
            .join('\n    ');
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
    async callLLM(systemPrompt, userPrompt) {
        try {
            const model = this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini';
            const provider = this.configService.get('LLM_PROVIDER') || 'openai';
            const combinedPrompt = provider === 'gemini'
                ? `System Instructions:\n${systemPrompt}\n\nUser Request:\n${userPrompt}`
                : null;
            let apiUrl;
            let requestBody;
            if (provider === 'gemini') {
                if (!this.geminiBaseUrl) {
                    throw new Error('GEMINI_BASE_URL is required in .env file. Example: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent');
                }
                if (this.geminiBaseUrl.includes('gemini-1.5-pro') || this.geminiBaseUrl.includes('gemini-1.5-flash') ||
                    (this.geminiBaseUrl.includes('gemini-pro:') && !this.geminiBaseUrl.includes('gemini-2.5-pro') && !this.geminiBaseUrl.includes('gemini-2.0-pro'))) {
                    this.logger.warn('⚠️  Model name may be deprecated. Available models: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash');
                }
                if (!this.openaiApiKey) {
                    throw new Error('OPENAI_API_KEY (Gemini API key) is required in .env file');
                }
                const separator = this.geminiBaseUrl.includes('?') ? '&' : '?';
                apiUrl = `${this.geminiBaseUrl}${separator}key=${this.openaiApiKey}`;
                requestBody = {
                    contents: [{
                            parts: [{ text: combinedPrompt }]
                        }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                };
                this.logger.log(`🔧 LLM Config: model=${model}, provider=${provider}, baseUrl=${this.geminiBaseUrl}`);
                this.logger.log(`📝 Using combined prompt for Gemini (system messages not supported)`);
                this.logger.log(`🔑 API key added as query parameter (Gemini requirement)`);
            }
            else if (provider === 'claude') {
                if (!this.claudeBaseUrl) {
                    throw new Error('CLAUDE_BASE_URL is required in .env file. Example: https://api.anthropic.com/v1/messages');
                }
                apiUrl = this.claudeBaseUrl;
                requestBody = {
                    model: model || 'claude-3-sonnet-20240229',
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [{
                            role: 'user',
                            content: userPrompt,
                        }],
                };
                this.logger.log(`🔧 LLM Config: model=${model}, provider=${provider}, baseUrl=${this.claudeBaseUrl}`);
                this.logger.log(`📝 Using separate system/user messages for Claude (system messages supported)`);
            }
            else {
                if (!this.openaiBaseUrl) {
                    throw new Error('OPENAI_BASE_URL is required in .env file. Example: https://api.openai.com/v1');
                }
                apiUrl = `${this.openaiBaseUrl}/chat/completions`;
                requestBody = {
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt,
                        },
                        {
                            role: 'user',
                            content: userPrompt,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    response_format: { type: 'json_object' },
                };
                this.logger.log(`🔧 LLM Config: model=${model}, provider=${provider}, baseUrl=${this.openaiBaseUrl}`);
            }
            this.logger.log(`📤 Sending request to: ${apiUrl}`);
            this.logger.log(`📤 Request body size: system=${systemPrompt.length} chars, user=${userPrompt.length} chars`);
            const headers = {
                'Content-Type': 'application/json',
            };
            if (provider === 'openai' || !provider) {
                headers['Authorization'] = `Bearer ${this.openaiApiKey}`;
            }
            else if (provider === 'gemini') {
            }
            else if (provider === 'claude') {
                headers['x-api-key'] = this.openaiApiKey;
                headers['anthropic-version'] = '2023-06-01';
            }
            let lastError = null;
            const maxRetries = 3;
            const baseDelay = 2000;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        this.logger.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
                    }
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(apiUrl, requestBody, {
                        headers,
                        timeout: 30000,
                    }));
                    this.logger.log(`📥 LLM API response status: ${response.status}`);
                    let content;
                    if (provider === 'gemini') {
                        const candidate = response.data?.candidates?.[0];
                        if (candidate?.finishReason) {
                            if (candidate.finishReason === 'MAX_TOKENS') {
                                this.logger.warn('⚠️ Gemini response truncated due to MAX_TOKENS limit - consider increasing maxOutputTokens');
                            }
                            else if (candidate.finishReason === 'SAFETY') {
                                this.logger.warn('⚠️ Gemini response blocked due to safety filters');
                                throw new Error('Gemini response blocked by safety filters');
                            }
                            else if (candidate.finishReason === 'RECITATION') {
                                this.logger.warn('⚠️ Gemini response blocked due to recitation policy');
                                throw new Error('Gemini response blocked by recitation policy');
                            }
                        }
                        content = candidate?.content?.parts?.[0]?.text || '';
                        if (!content && response.data) {
                            this.logger.error('❌ Gemini response structure:', JSON.stringify(response.data, null, 2));
                        }
                    }
                    else if (provider === 'claude') {
                        content = response.data?.content?.[0]?.text || '';
                    }
                    else {
                        content = response.data?.choices?.[0]?.message?.content || '';
                    }
                    if (!content) {
                        this.logger.error('❌ No content in LLM response', JSON.stringify(response.data, null, 2));
                        throw new Error('No content in LLM response');
                    }
                    this.logger.log(`📥 LLM response content length: ${content.length} chars`);
                    this.logger.log(`📥 LLM response preview: ${content.substring(0, 300)}...`);
                    let cleanedContent = content.trim();
                    if (cleanedContent.startsWith('```json')) {
                        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    }
                    else if (cleanedContent.startsWith('```')) {
                        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }
                    if (provider === 'gemini') {
                        cleanedContent = cleanedContent.replace(/[\x00-\x1F\x7F]/g, '');
                        const openBraces = (cleanedContent.match(/{/g) || []).length;
                        const closeBraces = (cleanedContent.match(/}/g) || []).length;
                        if (openBraces > closeBraces) {
                            this.logger.warn(`⚠️ JSON appears incomplete (${openBraces} open, ${closeBraces} close braces)`);
                            this.logger.warn(`📋 Full response: ${cleanedContent}`);
                            const incompleteStringMatch = cleanedContent.match(/"([^"]+)":\s*"([^"]*)$/);
                            if (incompleteStringMatch) {
                                const fieldName = incompleteStringMatch[1];
                                const incompleteValue = incompleteStringMatch[2];
                                const beforeIncomplete = cleanedContent.substring(0, incompleteStringMatch.index);
                                const cleanedBefore = beforeIncomplete.replace(/,\s*$/, '');
                                const requiredFields = [
                                    '"insights": ""',
                                    '"summary_for_ui": ""'
                                ];
                                const missingFields = [];
                                if (!cleanedBefore.includes('"insights"')) {
                                    missingFields.push('"insights": ""');
                                }
                                if (!cleanedBefore.includes('"summary_for_ui"')) {
                                    missingFields.push('"summary_for_ui": ""');
                                }
                                if (missingFields.length > 0) {
                                    cleanedContent = cleanedBefore + (cleanedBefore.endsWith(',') ? '' : ',') +
                                        missingFields.join(', ') + '}';
                                    this.logger.log(`🔧 Fixed incomplete JSON by adding missing fields: ${missingFields.join(', ')}`);
                                }
                                else {
                                    cleanedContent = cleanedBefore + '}';
                                    this.logger.log('🔧 Fixed incomplete JSON by closing the object');
                                }
                            }
                            else {
                                const missingBraces = openBraces - closeBraces;
                                cleanedContent += '\n' + '}'.repeat(missingBraces);
                                this.logger.log(`🔧 Attempting to fix JSON by adding ${missingBraces} closing braces`);
                            }
                        }
                        const unterminatedStringMatch = cleanedContent.match(/"[^"]*$/);
                        if (unterminatedStringMatch && !cleanedContent.endsWith('}')) {
                            this.logger.warn('⚠️ JSON appears to have unterminated string');
                            const lastCompleteField = cleanedContent.match(/"[^"]+":\s*"[^"]*",?\s*$/);
                            if (lastCompleteField) {
                                const beforeIncomplete = cleanedContent.substring(0, lastCompleteField.index + lastCompleteField[0].length);
                                cleanedContent = beforeIncomplete.replace(/,\s*$/, '') + '}';
                                this.logger.log('🔧 Fixed unterminated string by closing from last complete field');
                            }
                        }
                    }
                    return cleanedContent;
                }
                catch (error) {
                    lastError = error;
                    if (error.response?.status === 429 && attempt < maxRetries) {
                        const retryAfter = error.response?.headers?.['retry-after'] || error.response?.headers?.['x-ratelimit-reset-requests'];
                        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
                        this.logger.warn(`⚠️ Rate limit (429) - Attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delay / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error;
                }
            }
            if (lastError) {
                throw lastError;
            }
            throw new Error('LLM API call failed after retries');
        }
        catch (error) {
            this.logger.error('LLM API call failed', error.message);
            throw error;
        }
    }
    parseLLMResponse(jsonString, backendConfig) {
        try {
            this.logger.debug(`📋 Parsing JSON (${jsonString.length} chars): ${jsonString.substring(0, 500)}...`);
            let jsonToParse = jsonString.trim();
            jsonToParse = jsonToParse.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            const jsonMatch = jsonToParse.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0] !== jsonToParse) {
                this.logger.log('🔍 Extracting JSON object from response text');
                jsonToParse = jsonMatch[0];
            }
            let parsed;
            try {
                parsed = JSON.parse(jsonToParse);
            }
            catch (parseError) {
                this.logger.warn(`⚠️ Initial JSON parse failed: ${parseError.message}`);
                this.logger.warn(`📋 Attempting to fix JSON...`);
                jsonToParse = jsonToParse.replace(/,(\s*[}\]])/g, '$1');
                jsonToParse = jsonToParse.replace(/("([^"]*)":\s*")([^"]*)$/gm, (match, prefix, key, value) => {
                    if (!value.endsWith('"')) {
                        return prefix + value.replace(/[\n\r]/g, ' ') + '"';
                    }
                    return match;
                });
                const openCount = (jsonToParse.match(/{/g) || []).length;
                const closeCount = (jsonToParse.match(/}/g) || []).length;
                if (openCount > closeCount) {
                    jsonToParse = jsonToParse.trim().replace(/,\s*$/, '') + '\n' + '}'.repeat(openCount - closeCount);
                }
                try {
                    parsed = JSON.parse(jsonToParse);
                    this.logger.log('✅ Successfully fixed and parsed JSON');
                }
                catch (secondError) {
                    this.logger.error(`❌ Failed to fix JSON: ${secondError.message}`);
                    this.logger.error(`📋 Problematic JSON: ${jsonToParse.substring(0, 1000)}...`);
                    throw new Error(`Invalid JSON format: ${parseError.message}. Fixed attempt also failed: ${secondError.message}`);
                }
            }
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
            const validCategories = backendConfig.categories.map(c => c.id);
            if (!validCategories.includes(parsed.detected_category)) {
                parsed.detected_category = backendConfig.fallback_category;
                const fallbackCat = backendConfig.categories.find(c => c.id === backendConfig.fallback_category);
                parsed.category_label = fallbackCat?.label || parsed.detected_category;
            }
            else {
                const category = backendConfig.categories.find(c => c.id === parsed.detected_category);
                parsed.category_label = category?.label || parsed.detected_category;
            }
            const validEnergyStates = Object.keys(backendConfig.energy_rules);
            if (!validEnergyStates.includes(parsed.energy_state)) {
                parsed.energy_state = 'aligned';
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
        }
        catch (error) {
            this.logger.error('Failed to parse LLM response', error.message);
            throw new Error(`Invalid LLM response format: ${error.message}`);
        }
    }
    calculateScoresFromAnalysis(analysis, description, backendConfig) {
        const rules = backendConfig.scoring_rules;
        const energyStateScores = {
            aligned: { resonance: 85, alignment: 80, antrashaakti: 75, mahaadha: 10 },
            scattered: { resonance: 50, alignment: 40, antrashaakti: 45, mahaadha: 30 },
            blocked: { resonance: 30, alignment: 35, antrashaakti: 25, mahaadha: 80 },
            doubtful: { resonance: 45, alignment: 50, antrashaakti: 40, mahaadha: 50 },
            burned_out: { resonance: 40, alignment: 45, antrashaakti: 30, mahaadha: 60 },
        };
        const baseScores = energyStateScores[analysis.energy_state] || energyStateScores.aligned;
        const wordCount = description.split(/\s+/).length;
        const detailBonus = Math.min((wordCount / 10) * rules.word_count_bonus_per_10_words, 15);
        const resonance_score = Math.min(100, baseScores.resonance + detailBonus);
        const alignment_score = Math.min(100, baseScores.alignment + detailBonus);
        const antrashaakti_score = Math.min(100, baseScores.antrashaakti + detailBonus);
        const mahaadha_score = Math.max(0, baseScores.mahaadha - detailBonus / 2);
        const astro_support_index = this.calculateAstroSupport(analysis.detected_category);
        const mfp_score = Math.round(resonance_score * 0.25 +
            alignment_score * 0.20 +
            antrashaakti_score * 0.20 +
            (100 - mahaadha_score) * 0.15 +
            astro_support_index * 0.20);
        const baseCoherence = (resonance_score + alignment_score) / 2;
        const clarityBonus = description.length > 50 ? 5 : 0;
        const confidenceBonus = antrashaakti_score > 60 ? 5 : 0;
        const blockagePenalty = mahaadha_score > 30 ? -10 : 0;
        const coherence_score = Math.max(0, Math.min(100, baseCoherence + clarityBonus + confidenceBonus + blockagePenalty));
        return {
            resonance_score: Math.round(resonance_score),
            alignment_score: Math.round(alignment_score),
            antrashaakti_score: Math.round(antrashaakti_score),
            mahaadha_score: Math.round(mahaadha_score),
            astro_support_index: Math.round(astro_support_index),
            mfp_score,
            coherence_score: Math.round(coherence_score),
        };
    }
    calculateAstroSupport(category) {
        const categorySupport = {
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
    fallbackAnalysis(title, description, backendConfig, categoryHint) {
        let category = this.detectCategoryFallback(title, description, backendConfig, categoryHint);
        if (category === 'love' && !backendConfig.categories.find(c => c.id === 'love')) {
            const relationshipCat = backendConfig.categories.find(c => c.id === 'relationship');
            if (relationshipCat) {
                category = 'relationship';
            }
        }
        const categoryObj = backendConfig.categories.find(c => c.id === category) || backendConfig.categories.find(c => c.id === 'love') || backendConfig.categories.find(c => c.id === 'relationship');
        const energyState = this.detectEnergyStateFallback(description, backendConfig);
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
    detectCategoryFallback(title, description, backendConfig, hint) {
        const rawText = `${title} ${description}`;
        const normalizedText = text_normalizer_util_1.TextNormalizer.normalizeText(rawText);
        const text = normalizedText.toLowerCase();
        if (text_normalizer_util_1.TextNormalizer.hasHindiScript(rawText)) {
            this.logger.debug(`Hindi script detected in manifestation text for category detection`);
        }
        const relationshipTerms = [
            'girlfriend', 'boyfriend', 'wife', 'husband', 'partner', 'spouse', 'marriage', 'wedding', 'marry',
            'engaged', 'fiancé', 'fiancée', 'dating', 'date', 'romance', 'romantic', 'love', 'soulmate',
            'relationship', 'couple',
            'pyaar', 'prem', 'mohabbat', 'shadi', 'vivah', 'sathi', 'pati', 'patni', 'dost', 'parivar',
            'jivan sathi', 'sangini', 'sangat', 'प्रेम', 'प्यार', 'मोहब्बत', 'शादी', 'विवाह', 'साथी',
            'पति', 'पत्नी', 'दोस्त', 'परिवार', 'जीवनसाथी',
        ];
        const careerTerms = [
            'job', 'work', 'career', 'employment', 'profession', 'occupation', 'position', 'post', 'role',
            'naukri', 'nokri', 'kam', 'kaam', 'vyavasaya', 'pesha', 'नौकरी', 'काम', 'व्यवसाय', 'पेशा',
            'become', 'obtain', 'secure', 'land', 'apply', 'interview', 'promote', 'promotion',
            'banna', 'banana', 'pana', 'milna', 'बनना', 'पाना', 'मिलना',
            'teacher', 'doctor', 'engineer', 'lawyer', 'nurse', 'accountant', 'manager', 'director', 'executive',
            'developer', 'programmer', 'designer', 'artist', 'writer', 'journalist', 'consultant', 'analyst',
            'scientist', 'researcher', 'professor', 'lecturer', 'coach', 'trainer', 'instructor', 'mentor',
            'sikshak', 'adhyapak', 'master', 'daktar', 'vaidya', 'hakim', 'abhiyanta', 'vakil', 'nars',
            'शिक्षक', 'अध्यापक', 'डॉक्टर', 'वैद्य', 'इंजीनियर', 'वकील', 'नर्स', 'मैनेजर',
            'business', 'promotion', 'salary', 'raise', 'hike', 'bonus', 'office', 'workplace', 'colleague', 'boss',
            'professional', 'corporate', 'company', 'organization', 'firm', 'enterprise',
            'vyapar', 'dhandha', 'vetan', 'tankhwah', 'व्यापार', 'धंधा', 'वेतन', 'तनख्वाह',
            'cm', 'chief minister', 'minister', 'election', 'political', 'government', 'sarpanch', 'mla', 'mp',
            'politician', 'leader', 'bureaucrat', 'officer', 'administrator',
            'mukhyamantri', 'mantri', 'neta', 'sarkar', 'rajneeti', 'चुनाव', 'मुख्यमंत्री', 'मंत्री', 'नेता',
            'goal', 'ambition', 'aspiration', 'dream job', 'career growth', 'skill development',
            'lakshya', 'sapna', 'uddeshya', 'लक्ष्य', 'सपना', 'उद्देश्य',
            'resume', 'cv', 'interview',
        ];
        const wealthTerms = [
            'money', 'wealth', 'rich', 'financial', 'income', 'salary', 'savings', 'investment', 'debt', 'loan',
            'abundance', 'prosperity', 'finances', 'earn', 'million', 'billion', 'dollar', 'rupee',
            'paisa', 'rupay', 'rupee', 'rupaiya', 'dhan', 'sampatti', 'amiri', 'dhani', 'aay', 'kamai',
            'nivesh', 'bachet', 'udhar', 'karz', 'पैसा', 'रुपये', 'धन', 'संपत्ति', 'अमीर', 'धनी',
            'आय', 'कमाई', 'निवेश', 'बचत', 'उधार', 'कर्ज',
        ];
        const healthTerms = [
            'health', 'healthy', 'fitness', 'exercise', 'weight', 'diet', 'illness', 'disease', 'pain',
            'healing', 'recovery', 'wellness', 'wellbeing', 'doctor', 'hospital', 'medicine',
            'swasthya', 'tandurusti', 'bimari', 'rog', 'ilaj', 'upchar', 'dawai', 'dava', 'vajan', 'wajan',
            'vyayam', 'kasrat', 'aahar', 'dard', 'स्वास्थ्य', 'तंदुरुस्ती', 'बीमारी', 'रोग', 'इलाज',
            'उपचार', 'दवा', 'वजन', 'व्यायाम', 'कसरत', 'आहार', 'दर्द',
        ];
        const scores = {};
        for (const [cat, keywords] of Object.entries(backendConfig.category_keywords)) {
            let score = keywords.filter(kw => {
                const keyword = kw.toLowerCase();
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (regex.test(text)) {
                    return true;
                }
                return text_normalizer_util_1.TextNormalizer.fuzzyMatch(rawText, keyword, 1);
            }).length;
            if (cat === 'love' || cat === 'relationship') {
                const relationshipMatches = relationshipTerms.filter(term => text.includes(term)).length;
                score += relationshipMatches;
            }
            if (cat === 'career') {
                const careerMatches = careerTerms.filter(term => text.includes(term)).length;
                score += careerMatches * 2;
            }
            if (cat === 'wealth' || cat === 'money') {
                const wealthMatches = wealthTerms.filter(term => text.includes(term)).length;
                score += wealthMatches;
            }
            if (cat === 'health') {
                const healthMatches = healthTerms.filter(term => text.includes(term)).length;
                score += healthMatches;
            }
            if (cat === 'career' || cat === 'job') {
                const careerMatches = careerTerms.filter(term => text.includes(term)).length;
                score += careerMatches;
            }
            if (cat === 'wealth' || cat === 'money') {
                const wealthMatches = wealthTerms.filter(term => text.includes(term)).length;
                score += wealthMatches;
            }
            if (cat === 'health') {
                const healthMatches = healthTerms.filter(term => text.includes(term)).length;
                score += healthMatches;
            }
            scores[cat] = score;
        }
        const scoreEntries = Object.entries(scores);
        if (scoreEntries.length === 0) {
            return hint && backendConfig.categories.find(c => c.id === hint) ? hint : backendConfig.fallback_category;
        }
        const maxCategory = scoreEntries.reduce((a, b) => (scores[a[0]] > scores[b[0]] ? a : b))[0];
        if (scores[maxCategory] >= 1) {
            return maxCategory;
        }
        return hint && backendConfig.categories.find(c => c.id === hint) ? hint : backendConfig.fallback_category;
    }
    detectEnergyStateFallback(description, backendConfig) {
        const text = description.toLowerCase();
        for (const [state, rule] of Object.entries(backendConfig.energy_rules)) {
            if (!rule || !rule.patterns || !Array.isArray(rule.patterns)) {
                continue;
            }
            const matchCount = rule.patterns.filter(p => text.includes(p.toLowerCase())).length;
            if (matchCount >= 2) {
                const ruleDescription = rule.description || `${state} energy state detected`;
                return {
                    state: state,
                    reason: `${ruleDescription}. Detected ${matchCount} matching patterns: ${rule.patterns.filter(p => text.includes(p.toLowerCase())).join(', ')}.`,
                };
            }
        }
        const alignedRule = backendConfig.energy_rules?.aligned;
        return {
            state: 'aligned',
            reason: alignedRule?.description || 'Energy state is aligned with your intention.',
        };
    }
    generateRitualsFallback(category, description, backendConfig) {
        const categoryTemplates = (backendConfig.ritual_templates || []).filter(t => t && (t.category === category || t.category === 'all'));
        if (categoryTemplates.length === 0) {
            return ['Create a vision board for your manifestation', 'Practice daily meditation', 'Keep a gratitude journal'];
        }
        return categoryTemplates.slice(0, 3).map(t => {
            if (!t || !t.pattern)
                return 'Practice daily meditation';
            return t.pattern
                .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
                .replace('{{category_label}}', backendConfig.categories.find(c => c.id === category)?.label || category)
                .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '))
                .replace('{{category_color}}', t.category_color || 'white')
                .replace('{{category_specific_action}}', t.category_specific_action || 'meditation');
        });
    }
    generateWhatToManifestFallback(description, energyState, backendConfig) {
        const templates = (backendConfig.what_to_manifest_templates || []).filter(t => {
            if (!t)
                return false;
            if (t.condition === 'all')
                return true;
            return Array.isArray(t.condition) && t.condition.includes(energyState);
        });
        if (templates.length === 0) {
            return ['Clarify your intention with more specific details', 'Focus on the feeling you want to experience'];
        }
        return templates.slice(0, 3).map(t => {
            if (!t || !t.pattern)
                return 'Focus on clarity and positive intention';
            return t.pattern
                .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
                .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '));
        });
    }
    generateWhatNotToManifestFallback(description, energyState, backendConfig) {
        const templates = (backendConfig.what_not_to_manifest_templates || []).filter(t => {
            if (!t)
                return false;
            if (t.condition === 'all')
                return true;
            return Array.isArray(t.condition) && t.condition.includes(energyState);
        });
        if (templates.length === 0) {
            return ['Avoid negative self-talk', 'Don\'t force outcomes or become overly attached'];
        }
        return templates.slice(0, 3).map(t => {
            if (!t || !t.pattern)
                return 'Avoid negative self-talk';
            return t.pattern
                .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
                .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '))
                .replace('{{category_label}}', 'this area');
        });
    }
    generateThoughtAlignmentFallback(description, energyState, backendConfig) {
        const templates = (backendConfig.thought_alignment_templates || []).filter(t => {
            if (!t)
                return false;
            if (t.condition === 'all')
                return true;
            return Array.isArray(t.condition) && t.condition.includes(energyState);
        });
        if (templates.length === 0) {
            return ['Practice daily affirmations aligned with your desire', 'Monitor and reframe limiting beliefs'];
        }
        return templates.slice(0, 3).map(t => {
            if (!t || !t.pattern)
                return 'Practice daily affirmations';
            return t.pattern
                .replace('{{user_goal}}', description.split(' ').slice(0, 5).join(' '))
                .replace('{{user_focus}}', description.split(' ').slice(0, 3).join(' '));
        });
    }
    generateInsightsFallback(title, description, category, energyState, backendConfig) {
        const template = backendConfig.insight_templates?.[0];
        const categoryLabel = backendConfig.categories.find(c => c.id === category)?.label || category;
        const energyRule = backendConfig.energy_rules?.[energyState];
        if (!template || !template.pattern) {
            return `Your ${categoryLabel} manifestation is currently in a ${energyState} energy state. Focus on clarity and positive intention to improve alignment.`;
        }
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
    generateSummaryFallback(category, energyState, backendConfig) {
        const categoryLabel = backendConfig.categories.find(c => c.id === category)?.label || category;
        return backendConfig.summary_template
            .replace('{{category_label}}', categoryLabel)
            .replace('{{energy_state}}', energyState)
            .replace('{{main_focus}}', 'clarity and positive intention');
    }
};
exports.ManifestationLLMAnalyzerService = ManifestationLLMAnalyzerService;
exports.ManifestationLLMAnalyzerService = ManifestationLLMAnalyzerService = ManifestationLLMAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        prompt_service_1.PromptService])
], ManifestationLLMAnalyzerService);
//# sourceMappingURL=manifestation-llm-analyzer.service.js.map