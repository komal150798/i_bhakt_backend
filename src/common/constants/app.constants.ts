/**
 * Static Application Constants
 * These constants are defined in code (not in database)
 * Use for structural constants, enums, API categories, etc.
 * 
 * For dynamic constants (words, keywords, prompts), use ConstantsService with database
 */

export const AppConstants = {
  /**
   * API Categories
   */
  API_CATEGORY: [
    {
      api_type: 'STATE',
      category_name: 'State APIs',
      description: 'APIs provided by states for regional data and services.',
    },
    {
      api_type: 'CENTRAL',
      category_name: 'Central APIs',
      description: 'APIs offered by the central government for nationwide use.',
    },
    {
      api_type: 'ACM',
      category_name: 'Consent APIs',
      description: 'APIs that handle consent management and authorization flows.',
    },
    {
      api_type: 'IAM',
      category_name: 'Identity Access Manager APIs',
      description: 'APIs for authentication and role-based access control.',
    },
  ],

  /**
   * Manifestation Entry Types
   */
  MANIFESTATION_ENTRY_TYPES: [
    { value: 'general', label: 'General Manifestation', description: 'Standard manifestation entry' },
    { value: 'goal', label: 'Goal', description: 'Specific goal-oriented manifestation' },
    { value: 'affirmation', label: 'Affirmation', description: 'Daily affirmation statement' },
    { value: 'gratitude', label: 'Gratitude', description: 'Gratitude manifestation' },
    { value: 'intention', label: 'Intention', description: 'Intention setting manifestation' },
  ],

  /**
   * Journal Entry Types
   */
  JOURNAL_ENTRY_TYPES: [
    { value: 'general', label: 'General Entry', description: 'Regular journal entry' },
    { value: 'ledger', label: 'Karma Ledger', description: 'Karma action entry' },
    { value: 'reflection', label: 'Reflection', description: 'Self-reflection entry' },
    { value: 'gratitude', label: 'Gratitude', description: 'Gratitude journal entry' },
  ],

  /**
   * Energy States (Static definitions - detailed patterns in database)
   */
  ENERGY_STATES: [
    { value: 'aligned', label: 'Aligned', description: 'Clear intention, positive energy' },
    { value: 'scattered', label: 'Scattered', description: 'Multiple goals, lack of focus' },
    { value: 'blocked', label: 'Blocked', description: 'Resistance, limiting beliefs' },
    { value: 'doubtful', label: 'Doubtful', description: 'Uncertainty, low self-belief' },
    { value: 'burned_out', label: 'Burned Out', description: 'Fatigue, over-efforting' },
  ],

  /**
   * Manifestation Categories (Static list - keywords in database)
   */
  MANIFESTATION_CATEGORIES: [
    { value: 'relationship', label: 'Relationship', icon: '💕' },
    { value: 'career', label: 'Career', icon: '💼' },
    { value: 'money', label: 'Money', icon: '💰' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'spiritual', label: 'Spiritual', icon: '🕉️' },
    { value: 'love', label: 'Love', icon: '❤️' },
    { value: 'wealth', label: 'Wealth', icon: '💎' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'friendship', label: 'Friendship', icon: '👫' },
    { value: 'self_growth', label: 'Self Growth', icon: '🌱' },
    { value: 'spirituality', label: 'Spirituality', icon: '🧘' },
    { value: 'creativity', label: 'Creativity', icon: '🎨' },
    { value: 'other', label: 'Other', icon: '✨' },
  ],

  /**
   * Karma Action Types
   */
  KARMA_ACTION_TYPES: [
    { value: 'good', label: 'Good Karma', description: 'Positive action' },
    { value: 'bad', label: 'Bad Karma', description: 'Negative action' },
    { value: 'neutral', label: 'Neutral', description: 'Neutral action' },
  ],

  /**
   * User Roles
   */
  USER_ROLES: [
    { value: 'admin', label: 'Admin', description: 'System administrator' },
    { value: 'user', label: 'User', description: 'Regular user' },
    { value: 'premium', label: 'Premium User', description: 'Premium subscription user' },
    { value: 'moderator', label: 'Moderator', description: 'Content moderator' },
  ],

  /**
   * Subscription Status
   */
  SUBSCRIPTION_STATUS: [
    { value: 'active', label: 'Active', description: 'Active subscription' },
    { value: 'expired', label: 'Expired', description: 'Subscription expired' },
    { value: 'cancelled', label: 'Cancelled', description: 'Subscription cancelled' },
    { value: 'pending', label: 'Pending', description: 'Payment pending' },
  ],

  /**
   * LLM Providers
   */
  LLM_PROVIDERS: [
    { value: 'openai', label: 'OpenAI', description: 'ChatGPT, GPT-4, etc.' },
    { value: 'gemini', label: 'Google Gemini', description: 'Gemini Pro, Gemini Ultra' },
    { value: 'claude', label: 'Anthropic Claude', description: 'Claude 3, Claude 3.5' },
    { value: 'llama', label: 'Meta Llama', description: 'Llama 2, Llama 3' },
    { value: 'deepseek', label: 'DeepSeek', description: 'DeepSeek Chat' },
  ],

  /**
   * Prompt Types
   */
  PROMPT_TYPES: [
    { value: 'system', label: 'System Prompt', description: 'System-level instruction' },
    { value: 'user', label: 'User Prompt', description: 'User input template' },
    { value: 'instruction', label: 'Instruction', description: 'Task instruction' },
    { value: 'few_shot', label: 'Few-Shot', description: 'Few-shot examples' },
  ],

  /**
   * Constant Categories (for database constants)
   */
  CONSTANT_CATEGORIES: [
    { value: 'manifestation', label: 'Manifestation', description: 'Manifestation-related constants' },
    { value: 'journal', label: 'Journal', description: 'Journal-related constants' },
    { value: 'karma', label: 'Karma', description: 'Karma-related constants' },
    { value: 'common', label: 'Common', description: 'Common/shared constants' },
    { value: 'energy_states', label: 'Energy States', description: 'Energy state patterns' },
    { value: 'ai', label: 'AI', description: 'AI-related constants' },
  ],
};

/**
 * Helper function to get constant by key
 */
export function getStaticConstant(category: keyof typeof AppConstants, key?: string): any {
  if (key) {
    const categoryData = AppConstants[category];
    if (Array.isArray(categoryData)) {
      return categoryData.find((item: any) => item.value === key || item.api_type === key);
    }
    return categoryData[key];
  }
  return AppConstants[category];
}

/**
 * Helper function to get all items in a category
 */
export function getAllStaticConstants(category: keyof typeof AppConstants): any[] {
  const categoryData = AppConstants[category];
  return Array.isArray(categoryData) ? categoryData : [];
}

/**
 * Helper function to check if a value exists in a category
 */
export function hasStaticConstant(
  category: keyof typeof AppConstants,
  value: string,
  field: string = 'value',
): boolean {
  const categoryData = AppConstants[category];
  if (Array.isArray(categoryData)) {
    return categoryData.some((item: any) => item[field] === value);
  }
  return false;
}

export default AppConstants;

