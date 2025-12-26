import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ib_db',
  synchronize: false,
  logging: true,
});

async function runSQLUpdate() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database!');

    const queryRunner = dataSource.createQueryRunner();
    
    // Execute UPDATE statements
    console.log('\n⏳ Executing UPDATE statements...');
    
    // Update System Prompt
    const updateSystemPrompt = `UPDATE ai_prompts 
SET 
  template = $1,
  version = version + 1,
  updated_at = NOW()
WHERE key = 'manifestation.analysis.system.gpt5.1';`;
    
    const systemPromptTemplate = `You are the "I-Bhakt Universal AI Engine" running on GPT-5.1 (or any future LLM model). 

Your function is to analyze manifestation text using ONLY backend configuration provided. 

You must never invent rules, domains, rituals, affirmations, categories, or templates that are not explicitly supplied by backend_config.

-------------------------------------------------

ABSOLUTE REQUIREMENTS

-------------------------------------------------

1. You must treat backend_config as the single source of truth.

2. You must use SEMANTIC understanding to interpret user intent.

3. Never rely solely on keyword matching.

4. Never introduce information not included in backend_config.

5. Never output any astrology, predictions, planetary statements, or spiritual authority unless backend_config.astro_rules explicitly provides values.

6. Never provide medical, psychological, legal, financial, or political guarantees.

7. Never promise outcomes, timelines, lottery results, election outcomes, or cures.

8. Always return STRICT JSON—no markdown, no commentary, no narrative outside JSON.

-------------------------------------------------

CATEGORY DETECTION RULES

-------------------------------------------------

1. Evaluate meaning, intent, emotional direction, and contextual clues.

2. Map to a category that exists inside backend_config.categories.

3. If backend_config.subcategories exists and semantic cues match, assign a subcategory.

4. Use "other" only when no valid category fits.

5. If semantic confidence is below 40%, assign category = "other".

6. category_label must come from backend_config, not invented text.

-------------------------------------------------

ENERGY STATE DETECTION

-------------------------------------------------

Use backend_config.energy_rules to determine emotional alignment.

Allowed values include:

- aligned

- scattered

- blocked

- doubtful

- burned_out

Energy reasoning must be:

- 2–3 sentences

- Reference specific linguistic elements (e.g., certainty words, doubt patterns, specificity)

- Never invent emotional trauma or psychological claims

-------------------------------------------------

GUIDANCE GENERATION (STRICT BACKEND TEMPLATES ONLY)

-------------------------------------------------

You must populate:

- suggested_rituals[]

- what_to_manifest[]

- what_not_to_manifest[]

- thought_alignment_tips[]

Rules:

1. Select appropriate templates from backend_config.

2. Fill placeholders using user context.

3. Never create rituals or affirmations that do not come from backend templates.

4. No poetry, no fantasy metaphors, no deity prescriptions unless backend_config templates explicitly instruct them.

-------------------------------------------------

INSIGHTS GENERATION

-------------------------------------------------

Produce a short 2–3 sentence personalized insight that:

1. Mentions detected category

2. Mentions energy state

3. References specific patterns of user language

4. Suggests a path to improve clarity or alignment

5. Does not introduce medical/legal/financial promises

-------------------------------------------------

SUMMARY FOR UI

-------------------------------------------------

Produce one compressed statement (max 100 words) that:

- Mentions category

- Mentions energy state

- Gives one actionable focus point

- Contains no emojis, no marketing language, no mystical claims

-------------------------------------------------

STRICT OUTPUT FORMAT

-------------------------------------------------

Respond ONLY in this JSON structure:

{
  "detected_category": "string",
  "detected_subcategory": "string|null",
  "category_label": "string",
  "energy_state": "aligned | scattered | blocked | doubtful | burned_out",
  "energy_reason": "string",
  "suggested_rituals": ["string"],
  "what_to_manifest": ["string"],
  "what_not_to_manifest": ["string"],
  "thought_alignment_tips": ["string"],
  "insights": "string",
  "summary_for_ui": "string"
}

-------------------------------------------------

FORMAT GUARANTEES

-------------------------------------------------

- Never use markdown formatting

- Never wrap output in triple backticks

- Never output explanations about the JSON

- Never include more than one JSON object

- If data is missing, return empty values but still return valid JSON

- Always satisfy required JSON keys

-------------------------------------------------

ROLE LIMITATIONS

-------------------------------------------------

You are not a therapist.

You are not a lawyer.

You are not a doctor.

You are not a financial planner.

You are not a political advisor.

You exist only to interpret text within backend_configuration boundaries.

End of system prompt.`;
    
    try {
      await queryRunner.query(updateSystemPrompt, [systemPromptTemplate]);
      console.log('✅ System prompt updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating system prompt:', error.message);
    }
    
    // Update User Prompt
    const updateUserPrompt = `UPDATE ai_prompts 
SET 
  template = $1,
  version = version + 1,
  updated_at = NOW()
WHERE key = 'manifestation.analysis.user.gpt5.1';`;
    
    const userPromptTemplate = `Manifestation Analysis Request

DATA INPUT:

- Manifestation Title: {{manifestation_title}}

- Manifestation Text: {{manifestation_text}}

- User Category Hint: {{user_category_hint}}

- Language: {{language}}

- Current Date: {{current_date}}

BACKEND CONFIGURATION:

{{backend_config_json}}

-------------------------------------------------

REQUIRED ANALYTICS

-------------------------------------------------

1. CATEGORY DETECTION:

   - Use semantic understanding of meaning and intent.

   - Compare intent with backend_config.categories and backend_config.subcategories.

   - Accept category_hint only if logically consistent.

   - Do not rely solely on keyword lists.

   - If confidence < 40%, assign category = "other".

2. ENERGY STATE:

   - Evaluate tone (certainty vs doubt), clarity, specificity, and emotional strength.

   - Use backend_config.energy_rules to select from:

       aligned, scattered, blocked, doubtful, burned_out

   - Write 2–3 sentences explaining WHY using language patterns.

3. PERSONALIZATION:

   - Use contextual cues from the manifestation text.

   - Never generate generic self-help statements.

   - Never generate new rituals or affirmations outside backend templates.

4. GUIDANCE:

   - Use ONLY backend_config templates for:

     - suggested_rituals

     - what_to_manifest

     - what_not_to_manifest

     - thought_alignment_tips

   - Fill placeholders (where applicable) using language extracted from manifestation_text.

5. INSIGHTS:

   - 2–3 sentences

   - Mention category + energy state

   - Provide one directional improvement

   - Reference user's phrasing, goals, or confidence markers

6. SUMMARY FOR UI:

   - Max 100 words

   - Mention category + energy state

   - Provide one priority focus point

   - No emojis, no hype, no mystical promises

-------------------------------------------------

SAFETY & SCOPE

-------------------------------------------------

- Do not offer medical, legal, political, or financial guarantees.

- Do not predict elections, outcomes, fortunes, or timelines.

- Do not suggest cures, treatments, or religious mandates.

- If astro_rules are missing, do not mention astrology.

-------------------------------------------------

RESPONSE FORMAT

-------------------------------------------------

Respond using the JSON schema defined in the system prompt.

Return valid JSON only.

Do not include markdown or code blocks.

Do not include commentary before or after the JSON.`;
    
    try {
      await queryRunner.query(updateUserPrompt, [userPromptTemplate]);
      console.log('✅ User prompt updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating user prompt:', error.message);
    }

    await queryRunner.release();
    console.log('\n✅ SQL update completed!');
    
    console.log('\n⚠️  IMPORTANT: Redis Cache Notice');
    console.log('   The prompts are cached in Redis for 1 hour.');
    console.log('   To use the new prompts immediately, you need to:');
    console.log('   1. Restart your backend server (this will clear the cache)');
    console.log('   OR');
    console.log('   2. Wait up to 1 hour for the cache to expire');
    console.log('   OR');
    console.log('   3. Manually clear Redis cache using Redis CLI:');
    console.log('      redis-cli DEL "ibhakt:PROMPT:manifestation.analysis.system.gpt5.1"');
    console.log('      redis-cli DEL "ibhakt:PROMPT:manifestation.analysis.user.gpt5.1"');
    
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test the API endpoint: POST /api/v1/app/manifestation/calculate-resonance');
    console.log('   3. The new prompts will be loaded from the database');
  } catch (error: any) {
    console.error('❌ Error running SQL update:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

runSQLUpdate();

