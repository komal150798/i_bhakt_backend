/**
 * Text Normalization Utility for Indian Users
 * Handles:
 * - Spelling variations and typos
 * - Hindi transliteration (English to Hindi script)
 * - Common Indian English variations
 * - Village/rural language patterns
 */

export class TextNormalizer {
  /**
   * Common spelling variations for Indian users
   */
  private static readonly spellingVariations: Record<string, string[]> = {
    // Career variations
    'teacher': ['techer', 'teachr', 'tichar', 'tichr', 'टीचर', 'शिक्षक'],
    'doctor': ['doctr', 'doktr', 'daktar', 'डॉक्टर', 'वैद्य'],
    'engineer': ['enginr', 'engneer', 'engneer', 'इंजीनियर'],
    'job': ['jab', 'जॉब', 'नौकरी', 'काम'],
    'career': ['carrier', 'carreer', 'करियर'],
    'business': ['bussiness', 'bisness', 'बिजनेस', 'व्यापार'],
    'work': ['wrk', 'वर्क', 'काम'],
    'salary': ['salry', 'selry', 'सैलरी', 'वेतन'],
    'promotion': ['promoshun', 'promoshon', 'प्रोमोशन', 'पदोन्नति'],
    'manager': ['manger', 'meneger', 'मैनेजर', 'प्रबंधक'],
    
    // Relationship variations
    'love': ['lov', 'लव', 'प्यार', 'प्रेम', 'mohabbat', 'pyaar', 'prem'],
    'marriage': ['marige', 'marige', 'मैरिज', 'शादी', 'विवाह', 'shadi', 'vivah'],
    'married': ['meried', 'merid', 'मैरिड', 'शादीशुदा', 'shadi shuda'],
    'partner': ['partnr', 'पार्टनर', 'साथी', 'sathi', 'sangini'],
    'soulmate': ['soulmat', 'सोलमेट', 'जीवनसाथी', 'jivan sathi', 'jivansathi'],
    
    // Money variations
    'money': ['moni', 'muni', 'मनी', 'पैसा', 'धन', 'paisa', 'rupay', 'rupee', 'rupaiya', 'dhan'],
    'rich': ['ric', 'रिच', 'अमीर', 'धनी', 'amir', 'dhani'],
    'wealth': ['welth', 'वेल्थ', 'संपत्ति', 'धन', 'sampatti', 'dhan'],
    'income': ['incom', 'इनकम', 'आय', 'aay', 'kamai'],
    
    // Health variations
    'health': ['helth', 'हेल्थ', 'स्वास्थ्य', 'swasthya', 'tandurusti'],
    'fitness': ['fitnes', 'फिटनेस', 'तंदुरुस्ती', 'tandurusti', 'vyayam', 'kasrat'],
    'weight': ['weit', 'वेट', 'वजन', 'vajan', 'wajan'],
    'disease': ['diseas', 'डिजीज', 'रोग', 'बीमारी', 'bimari', 'rog'],
    
    // Spiritual variations
    'peace': ['pece', 'पीस', 'शांति', 'shanti'],
    'meditation': ['meditashun', 'मेडिटेशन', 'ध्यान', 'dhyan'],
    'spiritual': ['spritual', 'स्पिरिचुअल', 'आध्यात्मिक', 'adhyatmik', 'adhyatma'],
    'god': ['god', 'गॉड', 'भगवान', 'ईश्वर', 'ishwar', 'bhagwan'],
    
    // Common verbs
    'become': ['becom', 'बिकम', 'बनना'],
    'want': ['wnt', 'वांट', 'चाहिए', 'चाहता', 'चाहती'],
    'get': ['gt', 'गेट', 'मिलना', 'पाना'],
    'find': ['fnd', 'फाइंड', 'ढूंढना'],
  };

  /**
   * Hindi transliteration map (English to Hindi script)
   */
  private static readonly hindiTransliteration: Record<string, string> = {
    // Career
    'teacher': 'शिक्षक',
    'doctor': 'डॉक्टर',
    'engineer': 'इंजीनियर',
    'job': 'नौकरी',
    'career': 'करियर',
    'business': 'व्यापार',
    'work': 'काम',
    'salary': 'वेतन',
    'promotion': 'पदोन्नति',
    'manager': 'प्रबंधक',
    
    // Relationship
    'love': 'प्यार',
    'marriage': 'शादी',
    'partner': 'साथी',
    'soulmate': 'जीवनसाथी',
    
    // Money
    'money': 'पैसा',
    'rich': 'अमीर',
    'wealth': 'धन',
    'income': 'आय',
    
    // Health
    'health': 'स्वास्थ्य',
    'fitness': 'तंदुरुस्ती',
    'weight': 'वजन',
    'disease': 'रोग',
    
    // Spiritual
    'peace': 'शांति',
    'meditation': 'ध्यान',
    'spiritual': 'आध्यात्मिक',
    'god': 'भगवान',
  };

  /**
   * Common Indian English variations
   */
  private static readonly indianEnglishVariations: Record<string, string[]> = {
    'job': ['job', 'naukri', 'nokri', 'kam'],
    'teacher': ['teacher', 'sikshak', 'adhyapak', 'master'],
    'doctor': ['doctor', 'daktar', 'vaidya', 'hakim'],
    'money': ['money', 'paisa', 'rupee', 'rupay'],
    'marriage': ['marriage', 'shadi', 'vivah', 'wedding'],
    'love': ['love', 'pyaar', 'prem', 'mohabbat'],
    'business': ['business', 'vyapar', 'dhandha'],
    'health': ['health', 'swasthya', 'tandurusti'],
  };

  /**
   * Normalize text - handles spelling variations, typos, and transliteration
   */
  static normalizeText(text: string): string {
    let normalized = text.toLowerCase().trim();
    
    // Replace common spelling variations
    for (const [correct, variations] of Object.entries(this.spellingVariations)) {
      for (const variation of variations) {
        // Replace variation with correct spelling (case insensitive)
        const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'gi');
        normalized = normalized.replace(regex, correct);
      }
    }
    
    // Handle common typos (missing vowels, common mistakes)
    const commonTypos: Record<string, string> = {
      'techer': 'teacher',
      'doctr': 'doctor',
      'enginr': 'engineer',
      'jab': 'job',
      'carrier': 'career',
      'bussiness': 'business',
      'wrk': 'work',
      'salry': 'salary',
      'manger': 'manager',
      'lov': 'love',
      'marige': 'marriage',
      'moni': 'money',
      'ric': 'rich',
      'helth': 'health',
      'fitnes': 'fitness',
      'weit': 'weight',
      'pece': 'peace',
      'becom': 'become',
      'wnt': 'want',
      'gt': 'get',
      'fnd': 'find',
    };
    
    for (const [typo, correct] of Object.entries(commonTypos)) {
      const regex = new RegExp(`\\b${this.escapeRegex(typo)}\\b`, 'gi');
      normalized = normalized.replace(regex, correct);
    }
    
    return normalized;
  }

  /**
   * Check if text contains keyword (with fuzzy matching for typos)
   */
  static fuzzyMatch(text: string, keyword: string, maxDistance: number = 1): boolean {
    const normalizedText = this.normalizeText(text);
    const normalizedKeyword = keyword.toLowerCase();
    
    // Exact match after normalization
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
    
    // Check for keyword with common typos
    const keywordVariations = this.spellingVariations[normalizedKeyword] || [];
    for (const variation of keywordVariations) {
      if (normalizedText.includes(variation.toLowerCase())) {
        return true;
      }
    }
    
    // Check Indian English variations
    const indianVariations = this.indianEnglishVariations[normalizedKeyword] || [];
    for (const variation of indianVariations) {
      if (normalizedText.includes(variation.toLowerCase())) {
        return true;
      }
    }
    
    // Levenshtein distance for fuzzy matching (simple version)
    const words = normalizedText.split(/\s+/);
    for (const word of words) {
      if (this.levenshteinDistance(word, normalizedKeyword) <= maxDistance) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Extract Hindi words from text (Devanagari script)
   */
  static extractHindiWords(text: string): string[] {
    // Devanagari script range: \u0900-\u097F
    const hindiRegex = /[\u0900-\u097F]+/g;
    return text.match(hindiRegex) || [];
  }

  /**
   * Check if text contains Hindi script
   */
  static hasHindiScript(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }
}

