# Constants Service Usage Examples

## Overview

The Constants Service provides **two types of constants**:

1. **Database Constants** - Dynamic, stored in `app_constants` table (words, keywords, patterns)
2. **Static Constants** - Structural, defined in `app.constants.ts` (API categories, enums, types)

## Example 1: Using Database Constants (Dynamic)

```typescript
import { Injectable } from '@nestjs/common';
import { ConstantsService } from '../common/constants/constants.service';

@Injectable()
export class MyService {
  constructor(private readonly constantsService: ConstantsService) {}

  async analyzeText(text: string) {
    // Get positive keywords from database
    const positiveWords = await this.constantsService.getPositiveKeywords();
    // Returns: ['want', 'will', 'achieve', 'create', 'manifest', ...]

    // Get negative keywords from database
    const negativeWords = await this.constantsService.getNegativeKeywords();
    // Returns: ['can't', 'won't', 'impossible', 'never', ...]

    // Get any constant by key
    const intensityWords = await this.constantsService.getIntensityWords();
    // Returns: ['really', 'truly', 'deeply', 'absolutely', ...]

    // Use in your logic
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
  }
}
```

## Example 2: Using Static Constants (Code-defined)

```typescript
import { Injectable } from '@nestjs/common';
import { ConstantsService } from '../common/constants/constants.service';

@Injectable()
export class ApiService {
  constructor(private readonly constantsService: ConstantsService) {}

  getApiCategories() {
    // Get API categories (static constant)
    const categories = this.constantsService.getApiCategories();
    // Returns: [
    //   { api_type: 'STATE', category_name: 'State APIs', ... },
    //   { api_type: 'CENTRAL', category_name: 'Central APIs', ... },
    //   ...
    // ]

    return categories;
  }

  getApiCategoryByType(apiType: string) {
    // Get specific category
    const category = this.constantsService.getStaticConstant('API_CATEGORY', apiType);
    // Returns: { api_type: 'STATE', category_name: 'State APIs', ... } or undefined

    return category;
  }

  validateApiType(apiType: string): boolean {
    // Check if API type exists
    return this.constantsService.hasStaticConstant('API_CATEGORY', apiType, 'api_type');
  }
}
```

## Example 3: Using Both Types Together

```typescript
import { Injectable } from '@nestjs/common';
import { ConstantsService } from '../common/constants/constants.service';

@Injectable()
export class ManifestationService {
  constructor(private readonly constantsService: ConstantsService) {}

  async createManifestation(data: any) {
    // Static constant - get available entry types
    const entryTypes = this.constantsService.getManifestationEntryTypes();
    // Validate entry type
    const isValidType = entryTypes.some(type => type.value === data.entry_type);

    if (!isValidType) {
      throw new Error('Invalid entry type');
    }

    // Database constant - get positive words for analysis
    const positiveWords = await this.constantsService.getPositiveKeywords();
    const hasPositive = positiveWords.some(word => data.text.includes(word));

    // Static constant - get energy states
    const energyStates = this.constantsService.getEnergyStates();
    // Database constant - get energy state patterns
    const energyPatterns = await this.constantsService.getEnergyStatePatterns();

    // Use both to determine energy state
    const detectedState = this.detectEnergyState(data.text, energyPatterns, energyStates);

    return {
      entry_type: data.entry_type,
      has_positive_language: hasPositive,
      energy_state: detectedState,
    };
  }

  private detectEnergyState(
    text: string,
    patterns: Record<string, string[]>,
    states: Array<{ value: string; label: string }>
  ): string {
    // Detection logic using both static and database constants
    for (const state of states) {
      const statePatterns = patterns[state.value] || [];
      if (statePatterns.some(pattern => text.includes(pattern))) {
        return state.value;
      }
    }
    return 'aligned'; // default
  }
}
```

## Example 4: Direct Import (Static Constants Only)

If you only need static constants and don't need database constants, you can import directly:

```typescript
import { AppConstants, getStaticConstant } from '../common/constants/app.constants';

// Get all API categories
const apiCategories = AppConstants.API_CATEGORY;

// Get specific category
const stateApi = getStaticConstant('API_CATEGORY', 'STATE');

// Get all manifestation categories
const manifestationCategories = AppConstants.MANIFESTATION_CATEGORIES;
```

## Example 5: In Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { ConstantsService } from '../common/constants/constants.service';

@Controller('constants')
export class ConstantsController {
  constructor(private readonly constantsService: ConstantsService) {}

  @Get('api-categories')
  getApiCategories() {
    // Static constant - no async needed
    return this.constantsService.getApiCategories();
  }

  @Get('positive-keywords')
  async getPositiveKeywords() {
    // Database constant - async needed
    return await this.constantsService.getPositiveKeywords();
  }

  @Get('manifestation-categories')
  getManifestationCategories() {
    // Static constant
    return this.constantsService.getManifestationCategories();
  }

  @Get('energy-states')
  getEnergyStates() {
    // Static constant
    return this.constantsService.getEnergyStates();
  }
}
```

## Summary

| Type | Source | Async? | Use Case |
|------|--------|--------|----------|
| **Database Constants** | `app_constants` table | ✅ Yes (`await`) | Words, keywords, patterns, user-configurable values |
| **Static Constants** | `app.constants.ts` | ❌ No | API categories, enums, types, structural constants |

## Best Practices

1. **Use Database Constants for:**
   - Content that changes frequently
   - User-configurable values
   - Multi-language support
   - A/B testing values

2. **Use Static Constants for:**
   - Structural definitions
   - Enum values
   - API types/categories
   - System-level configurations

3. **Always use `await` for database constants** - they're async operations
4. **No `await` needed for static constants** - they're synchronous

