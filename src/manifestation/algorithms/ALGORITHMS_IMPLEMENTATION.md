# Algorithms for Smooth Manifestation Portal Operation

## Current Algorithms Implemented

### 1. ✅ Levenshtein Distance (Fuzzy Matching)
- **Purpose**: Typo tolerance
- **Location**: `text-normalizer.util.ts`
- **Complexity**: O(n*m) where n, m are string lengths
- **Status**: Working

### 2. ✅ Weighted Scoring Algorithm
- **Purpose**: MFP (Manifestation Fulfillment Probability) calculation
- **Formula**: Weighted average of all scores
- **Weights**: Resonance 25%, Alignment 20%, Antrashaakti 20%, Mahaadha 15%, Astro 20%
- **Status**: Working

### 3. ✅ Word Boundary Matching
- **Purpose**: Accurate keyword detection
- **Method**: Regex word boundaries (`\b`)
- **Status**: Working

### 4. ✅ Caching Algorithm
- **Purpose**: Performance optimization
- **Method**: Redis cache with TTL
- **Status**: Implemented

## Recommended Algorithm Improvements

### 1. **TF-IDF (Term Frequency-Inverse Document Frequency)**
**Purpose**: Better keyword importance weighting

```typescript
// Calculate TF-IDF for keywords
function calculateTFIDF(keyword: string, text: string, allManifestations: string[]): number {
  // Term Frequency
  const termCount = (text.match(new RegExp(keyword, 'gi')) || []).length;
  const totalTerms = text.split(/\s+/).length;
  const tf = termCount / totalTerms;
  
  // Inverse Document Frequency
  const docsWithTerm = allManifestations.filter(doc => 
    doc.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  const idf = Math.log(allManifestations.length / (docsWithTerm + 1));
  
  return tf * idf;
}
```

**Benefits**:
- More accurate category detection
- Better handling of common vs rare keywords
- Improved scoring accuracy

### 2. **Cosine Similarity for Category Matching**
**Purpose**: Better semantic matching

```typescript
function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const allWords = [...new Set([...words1, ...words2])];
  
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitude1 * magnitude2);
}
```

**Benefits**:
- Better semantic understanding
- Handles synonyms and related terms
- More accurate category detection

### 3. **N-gram Matching for Hindi/Transliteration**
**Purpose**: Better Hindi word matching

```typescript
function generateNGrams(text: string, n: number = 2): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

function ngramSimilarity(text1: string, text2: string, n: number = 2): number {
  const ngrams1 = generateNGrams(text1, n);
  const ngrams2 = generateNGrams(text2, n);
  const intersection = ngrams1.filter(ng => ngrams2.includes(ng));
  
  return intersection.length / Math.max(ngrams1.length, ngrams2.length);
}
```

**Benefits**:
- Better Hindi transliteration matching
- Handles word order variations
- More accurate for mixed language

### 4. **Confidence Scoring Algorithm**
**Purpose**: Measure category detection confidence

```typescript
function calculateConfidence(
  categoryScores: Record<string, number>,
  maxScore: number,
  secondMaxScore: number
): number {
  // If max score is much higher than second, high confidence
  const scoreDifference = maxScore - secondMaxScore;
  const scoreRatio = maxScore > 0 ? secondMaxScore / maxScore : 0;
  
  // Confidence based on:
  // 1. Score difference (larger = more confident)
  // 2. Score ratio (smaller = more confident)
  // 3. Absolute score (higher = more confident)
  const confidence = (
    (scoreDifference / maxScore) * 0.4 +  // 40% weight on difference
    (1 - scoreRatio) * 0.3 +                // 30% weight on ratio
    (maxScore / 100) * 0.3                  // 30% weight on absolute score
  ) * 100;
  
  return Math.min(100, Math.max(0, confidence));
}
```

**Benefits**:
- Know when category detection is uncertain
- Can trigger LLM fallback for low confidence
- Better user experience

### 5. **Adaptive Learning Algorithm**
**Purpose**: Learn from user corrections

```typescript
interface CategoryCorrection {
  originalText: string;
  detectedCategory: string;
  correctCategory: string;
  timestamp: Date;
}

class AdaptiveCategoryLearner {
  private corrections: CategoryCorrection[] = [];
  private keywordWeights: Map<string, Map<string, number>> = new Map();
  
  learn(correction: CategoryCorrection) {
    this.corrections.push(correction);
    
    // Extract keywords from text
    const keywords = this.extractKeywords(correction.originalText);
    
    // Adjust weights
    keywords.forEach(keyword => {
      if (!this.keywordWeights.has(keyword)) {
        this.keywordWeights.set(keyword, new Map());
      }
      
      const weights = this.keywordWeights.get(keyword)!;
      
      // Increase weight for correct category
      const currentWeight = weights.get(correction.correctCategory) || 0;
      weights.set(correction.correctCategory, currentWeight + 1);
      
      // Decrease weight for wrong category
      const wrongWeight = weights.get(correction.detectedCategory) || 0;
      weights.set(correction.detectedCategory, Math.max(0, wrongWeight - 0.5));
    });
  }
  
  getAdjustedScore(keyword: string, category: string): number {
    const weights = this.keywordWeights.get(keyword);
    if (!weights) return 1.0;
    
    const weight = weights.get(category) || 0;
    return 1.0 + (weight * 0.1); // Boost by 10% per correction
  }
}
```

**Benefits**:
- System learns from user feedback
- Improves accuracy over time
- Personalized for your user base

### 6. **Ranking Algorithm for Suggestions**
**Purpose**: Better tip/ritual ranking

```typescript
function rankSuggestions(
  suggestions: string[],
  category: string,
  userKundli: any,
  userHistory: any[]
): string[] {
  return suggestions
    .map(suggestion => ({
      text: suggestion,
      score: calculateRelevanceScore(suggestion, category, userKundli, userHistory)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.text);
}

function calculateRelevanceScore(
  suggestion: string,
  category: string,
  kundli: any,
  history: any[]
): number {
  let score = 50; // Base score
  
  // Category match
  if (suggestion.toLowerCase().includes(category)) score += 20;
  
  // Kundli alignment
  if (kundli) {
    const dashaLord = kundli.currentDasha?.mahadasha?.lord;
    if (suggestion.includes(dashaLord)) score += 30;
  }
  
  // User preference (from history)
  const similarSuggestions = history.filter(h => 
    cosineSimilarity(h.suggestion, suggestion) > 0.7
  );
  if (similarSuggestions.length > 0) score += 15;
  
  // Recency (prefer newer patterns)
  const recentSimilar = similarSuggestions.filter(h => 
    new Date(h.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  if (recentSimilar.length > 0) score += 10;
  
  return Math.min(100, score);
}
```

**Benefits**:
- More relevant suggestions
- Personalized based on kundli
- Learns from user preferences

### 7. **Clustering Algorithm for Similar Manifestations**
**Purpose**: Group similar manifestations

```typescript
function clusterManifestations(manifestations: any[]): any[][] {
  const clusters: any[][] = [];
  const processed = new Set<number>();
  
  manifestations.forEach((manifestation, i) => {
    if (processed.has(i)) return;
    
    const cluster = [manifestation];
    processed.add(i);
    
    manifestations.forEach((other, j) => {
      if (i === j || processed.has(j)) return;
      
      const similarity = cosineSimilarity(
        manifestation.description,
        other.description
      );
      
      if (similarity > 0.7) {
        cluster.push(other);
        processed.add(j);
      }
    });
    
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  });
  
  return clusters;
}
```

**Benefits**:
- Find patterns in user manifestations
- Suggest related goals
- Better insights

### 8. **Performance Optimization: Bloom Filter**
**Purpose**: Fast keyword lookup

```typescript
import { BloomFilter } from 'bloom-filters';

class KeywordBloomFilter {
  private filter: BloomFilter;
  private keywords: Set<string>;
  
  constructor(keywords: string[]) {
    this.keywords = new Set(keywords);
    this.filter = BloomFilter.create(keywords.length, 0.01); // 1% false positive rate
    
    keywords.forEach(keyword => this.filter.add(keyword));
  }
  
  mightContain(keyword: string): boolean {
    return this.filter.has(keyword);
  }
  
  contains(keyword: string): boolean {
    if (!this.mightContain(keyword)) return false;
    return this.keywords.has(keyword); // Verify with actual set
  }
}
```

**Benefits**:
- O(1) lookup time
- Memory efficient
- Fast category detection

### 9. **Sentiment Analysis Algorithm**
**Purpose**: Better resonance score

```typescript
function calculateSentimentScore(text: string): number {
  const positiveWords = ['happy', 'joy', 'love', 'success', 'achieve', ...];
  const negativeWords = ['sad', 'fear', 'doubt', 'fail', 'worry', ...];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 50; // Neutral
  
  const sentiment = (positiveCount / total) * 100;
  return sentiment;
}
```

**Benefits**:
- More accurate resonance score
- Better emotion detection
- Improved scoring

### 10. **Caching Strategy: LRU Cache**
**Purpose**: Better cache management

```typescript
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
}
```

**Benefits**:
- Better memory management
- Faster access to frequently used data
- Automatic cleanup

## Implementation Priority

### Phase 1: High Impact, Low Effort
1. ✅ **Confidence Scoring** - Easy to implement, big impact
2. ✅ **N-gram Matching** - Better Hindi support
3. ✅ **LRU Cache** - Better performance

### Phase 2: Medium Impact, Medium Effort
4. ✅ **TF-IDF** - Better keyword weighting
5. ✅ **Ranking Algorithm** - Better suggestions
6. ✅ **Sentiment Analysis** - Better scoring

### Phase 3: High Impact, High Effort
7. ✅ **Cosine Similarity** - Better semantic matching
8. ✅ **Adaptive Learning** - Long-term improvement
9. ✅ **Clustering** - Advanced insights

### Phase 4: Optimization
10. ✅ **Bloom Filter** - Performance optimization

## Recommended Implementation Order

1. **Start with Confidence Scoring** - Immediate value
2. **Add N-gram Matching** - Better Hindi support
3. **Implement TF-IDF** - Better accuracy
4. **Add Ranking Algorithm** - Better UX
5. **Implement Adaptive Learning** - Long-term improvement


