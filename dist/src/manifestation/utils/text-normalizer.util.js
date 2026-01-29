"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextNormalizer = void 0;
class TextNormalizer {
    static normalizeText(text) {
        let normalized = text.toLowerCase().trim();
        for (const [correct, variations] of Object.entries(this.spellingVariations)) {
            for (const variation of variations) {
                const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'gi');
                normalized = normalized.replace(regex, correct);
            }
        }
        const commonTypos = {
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
    static fuzzyMatch(text, keyword, maxDistance = 1) {
        const normalizedText = this.normalizeText(text);
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedText.includes(normalizedKeyword)) {
            return true;
        }
        const keywordVariations = this.spellingVariations[normalizedKeyword] || [];
        for (const variation of keywordVariations) {
            if (normalizedText.includes(variation.toLowerCase())) {
                return true;
            }
        }
        const indianVariations = this.indianEnglishVariations[normalizedKeyword] || [];
        for (const variation of indianVariations) {
            if (normalizedText.includes(variation.toLowerCase())) {
                return true;
            }
        }
        const words = normalizedText.split(/\s+/);
        for (const word of words) {
            if (this.levenshteinDistance(word, normalizedKeyword) <= maxDistance) {
                return true;
            }
        }
        return false;
    }
    static levenshteinDistance(str1, str2) {
        const matrix = [];
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
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    static escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    static extractHindiWords(text) {
        const hindiRegex = /[\u0900-\u097F]+/g;
        return text.match(hindiRegex) || [];
    }
    static hasHindiScript(text) {
        return /[\u0900-\u097F]/.test(text);
    }
}
exports.TextNormalizer = TextNormalizer;
TextNormalizer.spellingVariations = {
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
    'love': ['lov', 'लव', 'प्यार', 'प्रेम', 'mohabbat', 'pyaar', 'prem'],
    'marriage': ['marige', 'marige', 'मैरिज', 'शादी', 'विवाह', 'shadi', 'vivah'],
    'married': ['meried', 'merid', 'मैरिड', 'शादीशुदा', 'shadi shuda'],
    'partner': ['partnr', 'पार्टनर', 'साथी', 'sathi', 'sangini'],
    'soulmate': ['soulmat', 'सोलमेट', 'जीवनसाथी', 'jivan sathi', 'jivansathi'],
    'money': ['moni', 'muni', 'मनी', 'पैसा', 'धन', 'paisa', 'rupay', 'rupee', 'rupaiya', 'dhan'],
    'rich': ['ric', 'रिच', 'अमीर', 'धनी', 'amir', 'dhani'],
    'wealth': ['welth', 'वेल्थ', 'संपत्ति', 'धन', 'sampatti', 'dhan'],
    'income': ['incom', 'इनकम', 'आय', 'aay', 'kamai'],
    'health': ['helth', 'हेल्थ', 'स्वास्थ्य', 'swasthya', 'tandurusti'],
    'fitness': ['fitnes', 'फिटनेस', 'तंदुरुस्ती', 'tandurusti', 'vyayam', 'kasrat'],
    'weight': ['weit', 'वेट', 'वजन', 'vajan', 'wajan'],
    'disease': ['diseas', 'डिजीज', 'रोग', 'बीमारी', 'bimari', 'rog'],
    'peace': ['pece', 'पीस', 'शांति', 'shanti'],
    'meditation': ['meditashun', 'मेडिटेशन', 'ध्यान', 'dhyan'],
    'spiritual': ['spritual', 'स्पिरिचुअल', 'आध्यात्मिक', 'adhyatmik', 'adhyatma'],
    'god': ['god', 'गॉड', 'भगवान', 'ईश्वर', 'ishwar', 'bhagwan'],
    'become': ['becom', 'बिकम', 'बनना'],
    'want': ['wnt', 'वांट', 'चाहिए', 'चाहता', 'चाहती'],
    'get': ['gt', 'गेट', 'मिलना', 'पाना'],
    'find': ['fnd', 'फाइंड', 'ढूंढना'],
};
TextNormalizer.hindiTransliteration = {
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
    'love': 'प्यार',
    'marriage': 'शादी',
    'partner': 'साथी',
    'soulmate': 'जीवनसाथी',
    'money': 'पैसा',
    'rich': 'अमीर',
    'wealth': 'धन',
    'income': 'आय',
    'health': 'स्वास्थ्य',
    'fitness': 'तंदुरुस्ती',
    'weight': 'वजन',
    'disease': 'रोग',
    'peace': 'शांति',
    'meditation': 'ध्यान',
    'spiritual': 'आध्यात्मिक',
    'god': 'भगवान',
};
TextNormalizer.indianEnglishVariations = {
    'job': ['job', 'naukri', 'nokri', 'kam'],
    'teacher': ['teacher', 'sikshak', 'adhyapak', 'master'],
    'doctor': ['doctor', 'daktar', 'vaidya', 'hakim'],
    'money': ['money', 'paisa', 'rupee', 'rupay'],
    'marriage': ['marriage', 'shadi', 'vivah', 'wedding'],
    'love': ['love', 'pyaar', 'prem', 'mohabbat'],
    'business': ['business', 'vyapar', 'dhandha'],
    'health': ['health', 'swasthya', 'tandurusti'],
};
//# sourceMappingURL=text-normalizer.util.js.map