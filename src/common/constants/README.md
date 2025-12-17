# Constants System

This module provides a **dual-source constants system**:
1. **Database Constants** - Dynamic constants stored in `app_constants` table (words, keywords, patterns)
2. **Static Constants** - Structural constants defined in code (API categories, enums, types)

## Usage

### Database Constants (Dynamic)

These are stored in the database and can be updated via admin panel:

```typescript
// Get positive keywords (from database)
const positiveWords = await constantsService.getPositiveKeywords();

// Get negative keywords (from database)
const negativeWords = await constantsService.getNegativeKeywords();

// Get any constant by key
const value = await constantsService.getConstant('manifestation.positive_words');
```

### Static Constants (Code-defined)

These are defined in `app.constants.ts` and are structural/static:

```typescript
// Get API Categories
const apiCategories = constantsService.getApiCategories();
// Returns: [{ api_type: 'STATE', category_name: 'State APIs', ... }, ...]

// Get Manifestation Entry Types
const entryTypes = constantsService.getManifestationEntryTypes();

// Get Energy States
const energyStates = constantsService.getEnergyStates();

// Get specific constant by category and key
const stateApi = constantsService.getStaticConstant('API_CATEGORY', 'STATE');
```

## Available Static Constants

### API_CATEGORY
- `STATE` - State APIs
- `CENTRAL` - Central APIs
- `ACM` - Consent APIs
- `IAM` - Identity Access Manager APIs

### MANIFESTATION_ENTRY_TYPES
- `general` - General Manifestation
- `goal` - Goal
- `affirmation` - Affirmation
- `gratitude` - Gratitude
- `intention` - Intention

### JOURNAL_ENTRY_TYPES
- `general` - General Entry
- `ledger` - Karma Ledger
- `reflection` - Reflection
- `gratitude` - Gratitude

### ENERGY_STATES
- `aligned` - Aligned
- `scattered` - Scattered
- `blocked` - Blocked
- `doubtful` - Doubtful
- `burned_out` - Burned Out

### MANIFESTATION_CATEGORIES
- `relationship`, `career`, `money`, `health`, `spiritual`, etc.

### KARMA_ACTION_TYPES
- `good` - Good Karma
- `bad` - Bad Karma
- `neutral` - Neutral

### USER_ROLES
- `admin` - Admin
- `user` - User
- `premium` - Premium User
- `moderator` - Moderator

### SUBSCRIPTION_STATUS
- `active` - Active
- `expired` - Expired
- `cancelled` - Cancelled
- `pending` - Pending

### LLM_PROVIDERS
- `openai` - OpenAI
- `gemini` - Google Gemini
- `claude` - Anthropic Claude
- `llama` - Meta Llama
- `deepseek` - DeepSeek

### PROMPT_TYPES
- `system` - System Prompt
- `user` - User Prompt
- `instruction` - Instruction
- `few_shot` - Few-Shot

## Adding New Static Constants

Edit `app.constants.ts`:

```typescript
export const AppConstants = {
  // ... existing constants
  
  YOUR_NEW_CATEGORY: [
    { value: 'option1', label: 'Option 1', description: 'Description' },
    { value: 'option2', label: 'Option 2', description: 'Description' },
  ],
};
```

Then add a convenience method in `constants.service.ts`:

```typescript
getYourNewCategory(): Array<{ value: string; label: string; description: string }> {
  return AppConstants.YOUR_NEW_CATEGORY;
}
```

## When to Use Database vs Static Constants

**Use Database Constants for:**
- Words, keywords, phrases that may change
- User-configurable values
- Content that needs admin control
- Multi-language support
- A/B testing values

**Use Static Constants for:**
- API categories/types
- Enum values
- Structural constants
- System-level configurations
- Type definitions

