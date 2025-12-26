# Manifestation Resonance Calculation Improvements

## Overview
The `/api/v1/app/manifestation/calculate-resonance` endpoint has been significantly enhanced to use actual kundli data (dasha periods, planetary positions, and house placements) for accurate manifestation analysis.

## Key Improvements

### 1. **Kundli Data Integration**
- **Before**: Used hardcoded "Unknown" dasha values or tried to fetch from `dasha_records` table (often empty)
- **After**: 
  - Fetches kundli data with `dasha_timeline` from `kundli` table
  - Gets planetary positions from `kundli_planets` table
  - Gets house positions from `kundli_houses` table
  - Calculates current dasha periods from `dasha_timeline` JSONB field

### 2. **Current Dasha Calculation**
- **Method**: `calculateCurrentDashaFromTimeline()`
- Calculates current Mahadasha, Antardasha, Pratyantar, and Sukshma periods from kundli's `dasha_timeline`
- Falls back to `dasha_records` table if timeline is not available
- Provides accurate period dates and lords

### 3. **Enhanced Tips Generation**
All tips are now personalized based on actual kundli data:

#### **Rituals** (☑)
- Dasha-specific rituals based on current Mahadasha and Antardasha lords
- Category-specific mantras and practices
- Examples:
  - Jupiter Mahadasha for career: "Chant 'Om Gurave Namah' 108 times daily"
  - Venus Mahadasha for love: "Chant 'Om Shukraya Namah' 108 times daily"

#### **What to Manifest** (⭐)
- Based on planetary positions in relevant houses
- Considers planet-house combinations for category
- Example: "Focus on Jupiter's energy in 10th house for career growth"

#### **What NOT to Manifest** (✗)
- Warns about retrograde planets
- Identifies challenging planetary periods
- Example: "Avoid hasty decisions during Mercury retrograde period"

#### **Karmic Theme** (☁)
- Analyzes house positions relevant to manifestation category
- Identifies karmic patterns based on sign placements in key houses
- Example: "Your karmic theme for career is influenced by Capricorn, Leo energy in key houses"

#### **Thought Alignment** (💭)
- Dasha-specific alignment guidance
- Category-specific mental frameworks
- Example: "Align your thoughts with expansion and growth. Jupiter supports learning and teaching."

#### **Daily Actions** (🧘)
- Personalized daily practices based on:
  - Current planetary influences
  - Dasha lord energy
  - Planet-house combinations
- Example: "Meditate on Jupiter's energy in 10th house daily"

### 4. **Enhanced Insights**
- **Astro Insights**: Detailed analysis based on:
  - Current Dasha periods
  - Birth Nakshatra
  - Ascendant (Lagna)
  - Planetary positions in relevant houses
- Provides comprehensive astrological context for the manifestation

### 5. **Dasha Resonance Calculation**
- Uses actual dasha lords from kundli data
- Calculates supportive/challenging percentages based on:
  - Category-specific planet alignments
  - Primary, secondary, neutral, and challenging planets for each category
- Provides accurate period dates

## Category-Specific Planet Alignments

### Career
- **Primary**: Mercury, Jupiter, Sun
- **Secondary**: Venus, Moon
- **Neutral**: Mars
- **Challenging**: Saturn, Rahu, Ketu

### Love/Relationship
- **Primary**: Venus, Jupiter
- **Secondary**: Moon, Mercury
- **Neutral**: Sun, Mars
- **Challenging**: Saturn, Rahu, Ketu

### Wealth/Money
- **Primary**: Jupiter, Venus
- **Secondary**: Mercury, Moon
- **Neutral**: Sun
- **Challenging**: Saturn, Mars, Rahu, Ketu

### Health
- **Primary**: Mars, Sun, Moon
- **Secondary**: Jupiter
- **Neutral**: Mercury, Venus
- **Challenging**: Saturn, Rahu, Ketu

### Spiritual
- **Primary**: Jupiter, Ketu, Saturn
- **Secondary**: Moon, Sun
- **Neutral**: Mercury, Venus
- **Challenging**: Mars, Rahu

## Data Flow

```
User Request
    ↓
Get User & Ensure Kundli Exists
    ↓
Fetch Kundli Data
    ├─ dasha_timeline (JSONB)
    ├─ kundli_planets (table)
    └─ kundli_houses (table)
    ↓
Calculate Current Dasha Periods
    ├─ Mahadasha
    ├─ Antardasha
    ├─ Pratyantar
    └─ Sukshma
    ↓
Run AI Evaluation (LLM)
    ↓
Calculate Dasha Resonance
    ├─ Based on category-specific planet alignments
    └─ Supportive/Challenging percentages
    ↓
Generate Enhanced Tips
    ├─ Rituals (dasha-specific)
    ├─ What to Manifest (planetary guidance)
    ├─ What NOT to Manifest (retrograde warnings)
    ├─ Karmic Theme (house analysis)
    ├─ Thought Alignment (dasha guidance)
    └─ Daily Actions (planetary influences)
    ↓
Generate Enhanced Insights
    └─ Astro insights (nakshatra, lagna, planets)
    ↓
Return Complete Response
```

## Response Structure

The API now returns:
- ✅ **Accurate Dasha Data**: Real lords and periods from kundli
- ✅ **Personalized Tips**: Based on actual planetary positions
- ✅ **Karmic Analysis**: Based on house placements
- ✅ **Astro Insights**: Comprehensive astrological context
- ✅ **Supportive/Challenging Factors**: Based on real dasha analysis

## Requirements

1. **Kundli Must Exist**: The system ensures kundli exists before calculation
2. **dasha_timeline Must Be Populated**: Should be saved when kundli is generated
3. **Planets & Houses**: Should be saved in `kundli_planets` and `kundli_houses` tables

## Example Response

```json
{
  "success": true,
  "code": 200,
  "message": "Resonance score calculated.",
  "data": {
    "resonance_score": 86,
    "dasha_resonance": {
      "mahadasha": {
        "lord": "Jupiter",
        "supportive": 90,
        "challenging": 10,
        "period": "2020-01-15 to 2036-01-15"
      },
      "antardasha": {
        "lord": "Jupiter",
        "supportive": 90,
        "challenging": 10,
        "period": "2024-01-15 to 2025-01-15"
      }
    },
    "tips": {
      "rituals": [
        "Chant 'Om Gurave Namah' 108 times daily for career growth.",
        "Wear yellow clothes on Thursdays and offer yellow flowers to Lord Vishnu."
      ],
      "what_to_manifest": [
        "Focus on Jupiter's energy in 10th house for career growth."
      ],
      "karmic_theme": "Your karmic theme for career is influenced by Capricorn, Leo energy in key houses.",
      "thought_alignment": [
        "Align your thoughts with expansion and growth. Jupiter supports learning and teaching."
      ],
      "daily_actions": [
        "Meditate on Jupiter's energy in 10th house daily.",
        "Align your daily actions with Jupiter Mahadasha energy for better results."
      ]
    },
    "insights": {
      "astro_insights": "Current Dasha: Jupiter Mahadasha with Jupiter Antardasha. Your birth Nakshatra is Pushya, which influences your approach to career. Your Ascendant (Lagna) is Capricorn, indicating your natural approach to career matters. Key planetary influences: Jupiter in 10th house, Sun in 1st house."
    }
  }
}
```

## Testing

1. Ensure user has complete birth data (date, time, place, coordinates)
2. Ensure kundli is generated and saved with:
   - `dasha_timeline` populated
   - Planets saved in `kundli_planets` table
   - Houses saved in `kundli_houses` table
3. Call `/api/v1/app/manifestation/calculate-resonance` with manifestation description
4. Verify response contains:
   - Real dasha lords (not "Unknown")
   - Personalized tips based on kundli
   - Astro insights with actual data

## Notes

- If kundli data is missing, the system falls back to basic AI evaluation
- Dasha calculation uses Vimshottari Dasha system
- All planetary analysis is based on actual positions from kundli
- Tips are dynamically generated based on current dasha and planetary positions

