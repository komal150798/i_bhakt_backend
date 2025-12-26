# Kundli Tables Structure Explanation

## Why Separate Tables?

### 1. **kundli** (Main Table)
- Stores **summary and metadata** about the birth chart
- Contains JSONB fields (`full_data`, `dasha_timeline`, `navamsa_data`) for complete data storage
- Stores basic birth information and calculated values (lagna, nakshatra, pada, etc.)

### 2. **kundli_planets** (Normalized Table)
- Stores **individual planetary positions** in a normalized relational format
- **Why separate?**
  - **Better Querying**: Query "all customers with Sun in 1st house" easily
  - **Better Indexing**: Index on planet_name, house_number, sign_name for fast searches
  - **Analytics**: Easy to analyze planetary patterns across all kundlis
  - **Filtering**: Filter by specific planet positions without parsing JSON
  - **Performance**: Relational queries are faster than JSONB queries

### 3. **kundli_houses** (Normalized Table)
- Stores **house cusp information** (12 houses) in normalized format
- **Why separate?**
  - **Better Querying**: Query "all customers with specific sign in 1st house"
  - **House Analysis**: Easy to analyze house patterns
  - **Performance**: Direct queries on house data without JSON parsing

## Data Flow

```
Birth Data → Calculate Kundli → Save to Database
                                    ├─ kundli (summary + JSONB)
                                    ├─ kundli_planets (9 planets)
                                    └─ kundli_houses (12 houses)
```

## Fields Explanation

### kundli.dasha_timeline
- **Purpose**: Stores Vimshottari Dasha timeline (planetary periods)
- **Format**: JSONB array of dasha periods with start/end dates
- **Use**: Predict future periods, current dasha, upcoming dashas
- **Example**: `[{lord: "Moon", start: "1998-07-15", end: "2008-07-15"}, ...]`

### kundli.navamsa_data
- **Purpose**: Stores Navamsa (D9) chart data for marriage analysis
- **Format**: JSONB object with D9 chart details
- **Use**: Marriage compatibility, relationship analysis
- **Example**: `{d9_chart: {...}, marriage_strength: "strong"}`

### kundli.full_data
- **Purpose**: Complete kundli data in JSON format
- **Contains**: All planetary positions, house analysis, yogas, doshas, etc.
- **Use**: Complete chart data for detailed analysis

## When to Use Which Table?

1. **kundli table**: 
   - Get complete kundli summary
   - Get dasha timeline
   - Get navamsa data
   - Get full JSON data

2. **kundli_planets table**:
   - Query specific planet positions
   - Filter by planet in specific house
   - Analyze planetary patterns
   - Get planet-specific data

3. **kundli_houses table**:
   - Query house cusps
   - Analyze house patterns
   - Get house-specific data

## Current Issue

The `saveKundliToDatabase` method is **NOT** saving:
- ❌ `dasha_timeline` (calculated but not saved)
- ❌ `navamsa_data` (calculated but not saved)
- ❌ Planets to `kundli_planets` table (comment says "simplified - implement full logic")
- ❌ Houses to `kundli_houses` table (comment says "simplified - implement full logic")

**This needs to be fixed!**


