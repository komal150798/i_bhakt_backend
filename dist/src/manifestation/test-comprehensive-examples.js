"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_normalizer_util_1 = require("./utils/text-normalizer.util");
const testCases = [
    {
        title: 'Career - Teacher',
        description: 'I want to become a teacher in 2028',
        expectedCategory: 'career',
        language: 'english',
    },
    {
        title: 'Career - Teacher (Hindi)',
        description: 'मैं 2028 में शिक्षक बनना चाहता हूं',
        expectedCategory: 'career',
        language: 'hindi',
    },
    {
        title: 'Career - Teacher (Typo)',
        description: 'I want to becom a techer in 2028',
        expectedCategory: 'career',
        language: 'typo',
    },
    {
        title: 'Career - Doctor',
        description: 'मुझे डॉक्टर बनना है',
        expectedCategory: 'career',
        language: 'hindi',
    },
    {
        title: 'Career - Job',
        description: 'मुझे naukri चाहिए',
        expectedCategory: 'career',
        language: 'mixed',
    },
    {
        title: 'Career - Engineer',
        description: 'I want to become an enginr',
        expectedCategory: 'career',
        language: 'typo',
    },
    {
        title: 'Career - Manager',
        description: 'I want promotion to manager position',
        expectedCategory: 'career',
        language: 'english',
    },
    {
        title: 'Career - Chief Minister',
        description: 'मैं मुख्यमंत्री बनना चाहता हूं',
        expectedCategory: 'career',
        language: 'hindi',
    },
    {
        title: 'Love - Soulmate',
        description: 'I want to find my soulmate',
        expectedCategory: 'relationship',
        language: 'english',
    },
    {
        title: 'Love - Marriage',
        description: 'मुझे शादी करनी है',
        expectedCategory: 'relationship',
        language: 'hindi',
    },
    {
        title: 'Love - Find Love',
        description: 'I want to find lov',
        expectedCategory: 'relationship',
        language: 'typo',
    },
    {
        title: 'Love - Partner',
        description: 'मुझे साथी चाहिए',
        expectedCategory: 'relationship',
        language: 'hindi',
    },
    {
        title: 'Love - Get Married',
        description: 'I want to get marige',
        expectedCategory: 'relationship',
        language: 'typo',
    },
    {
        title: 'Love - Pyaar',
        description: 'मुझे pyaar चाहिए',
        expectedCategory: 'relationship',
        language: 'mixed',
    },
    {
        title: 'Personal - Confidence',
        description: 'I want to improve my self confidence',
        expectedCategory: 'personal',
        language: 'english',
    },
    {
        title: 'Personal - Growth',
        description: 'मैं अपना विकास चाहता हूं',
        expectedCategory: 'personal',
        language: 'hindi',
    },
    {
        title: 'Personal - Transformation',
        description: 'I want to transform myself',
        expectedCategory: 'personal',
        language: 'english',
    },
    {
        title: 'Personal - Better Person',
        description: 'मैं बेहतर इंसान बनना चाहता हूं',
        expectedCategory: 'personal',
        language: 'hindi',
    },
    {
        title: 'Personal - Success',
        description: 'I want to achieve success in life',
        expectedCategory: 'personal',
        language: 'english',
    },
    {
        title: 'Money - Rich',
        description: 'I want to become rich',
        expectedCategory: 'money',
        language: 'english',
    },
    {
        title: 'Money - Paisa',
        description: 'मुझे पैसा चाहिए',
        expectedCategory: 'money',
        language: 'hindi',
    },
    {
        title: 'Money - Earn',
        description: 'I want to earn moni',
        expectedCategory: 'money',
        language: 'typo',
    },
    {
        title: 'Money - Financial Freedom',
        description: 'मैं आर्थिक स्वतंत्रता चाहता हूं',
        expectedCategory: 'money',
        language: 'hindi',
    },
    {
        title: 'Money - Wealth',
        description: 'I want to accumulate welth',
        expectedCategory: 'money',
        language: 'typo',
    },
    {
        title: 'Money - Income',
        description: 'मुझे अधिक आय चाहिए',
        expectedCategory: 'money',
        language: 'hindi',
    },
    {
        title: 'Business - Start Business',
        description: 'I want to start my own business',
        expectedCategory: 'business',
        language: 'english',
    },
    {
        title: 'Business - Vyapar',
        description: 'मैं अपना व्यापार शुरू करना चाहता हूं',
        expectedCategory: 'business',
        language: 'hindi',
    },
    {
        title: 'Business - Dhandha',
        description: 'मुझे dhandha करना है',
        expectedCategory: 'business',
        language: 'mixed',
    },
    {
        title: 'Business - Entrepreneur',
        description: 'I want to become an entrepreneur',
        expectedCategory: 'business',
        language: 'english',
    },
    {
        title: 'Business - Business Growth',
        description: 'मैं अपने व्यापार को बढ़ाना चाहता हूं',
        expectedCategory: 'business',
        language: 'hindi',
    },
    {
        title: 'Farming - Good Harvest',
        description: 'I want a good harvest this year',
        expectedCategory: 'farming',
        language: 'english',
    },
    {
        title: 'Farming - Kheti',
        description: 'मुझे अच्छी खेती चाहिए',
        expectedCategory: 'farming',
        language: 'hindi',
    },
    {
        title: 'Farming - Crop Yield',
        description: 'I want better crop yield',
        expectedCategory: 'farming',
        language: 'english',
    },
    {
        title: 'Farming - Kisan',
        description: 'मैं एक सफल किसान बनना चाहता हूं',
        expectedCategory: 'farming',
        language: 'hindi',
    },
    {
        title: 'Farming - Agriculture',
        description: 'I want success in agriculture',
        expectedCategory: 'farming',
        language: 'english',
    },
    {
        title: 'Farming - Fasal',
        description: 'मुझे अच्छी फसल चाहिए',
        expectedCategory: 'farming',
        language: 'hindi',
    },
    {
        title: 'Family - Harmony',
        description: 'I want family harmony',
        expectedCategory: 'family',
        language: 'english',
    },
    {
        title: 'Family - Parivar',
        description: 'मुझे परिवार में शांति चाहिए',
        expectedCategory: 'family',
        language: 'hindi',
    },
    {
        title: 'Family - Happiness',
        description: 'I want my family to be happy',
        expectedCategory: 'family',
        language: 'english',
    },
    {
        title: 'Family - Ghar',
        description: 'मुझे घर में खुशी चाहिए',
        expectedCategory: 'family',
        language: 'hindi',
    },
    {
        title: 'Family - Support',
        description: 'I want family support',
        expectedCategory: 'family',
        language: 'english',
    },
    {
        title: 'Health - Weight Loss',
        description: 'I want to lose weight',
        expectedCategory: 'health',
        language: 'english',
    },
    {
        title: 'Health - Swasthya',
        description: 'मुझे स्वास्थ्य चाहिए',
        expectedCategory: 'health',
        language: 'hindi',
    },
    {
        title: 'Health - Fitness',
        description: 'I want to be fitnes',
        expectedCategory: 'health',
        language: 'typo',
    },
    {
        title: 'Health - Cure',
        description: 'मुझे बीमारी से छुटकारा चाहिए',
        expectedCategory: 'health',
        language: 'hindi',
    },
    {
        title: 'Spiritual - Peace',
        description: 'I want to find pece',
        expectedCategory: 'spiritual',
        language: 'typo',
    },
    {
        title: 'Spiritual - Shanti',
        description: 'मुझे शांति चाहिए',
        expectedCategory: 'spiritual',
        language: 'hindi',
    },
    {
        title: 'Spiritual - Meditation',
        description: 'I want to start meditashun',
        expectedCategory: 'spiritual',
        language: 'typo',
    },
    {
        title: 'Spiritual - Dhyan',
        description: 'मुझे ध्यान करना है',
        expectedCategory: 'spiritual',
        language: 'hindi',
    },
];
function detectCategory(title, description) {
    const rawText = `${title} ${description}`;
    const normalizedText = text_normalizer_util_1.TextNormalizer.normalizeText(rawText);
    const text = normalizedText.toLowerCase();
    const categoryKeywords = {
        career: [
            'job', 'career', 'work', 'employment', 'profession', 'occupation', 'position', 'role', 'post',
            'naukri', 'nokri', 'kam', 'kaam', 'vyavasaya', 'pesha', 'नौकरी', 'काम', 'व्यवसाय', 'पेशा',
            'become', 'obtain', 'secure', 'land', 'apply', 'interview', 'promote', 'promotion',
            'banna', 'banana', 'pana', 'milna', 'बनना', 'पाना', 'मिलना',
            'teacher', 'doctor', 'engineer', 'lawyer', 'nurse', 'accountant', 'manager', 'director', 'executive',
            'developer', 'programmer', 'designer', 'artist', 'writer', 'journalist', 'consultant', 'analyst',
            'scientist', 'researcher', 'professor', 'lecturer', 'coach', 'trainer', 'instructor', 'mentor',
            'sikshak', 'adhyapak', 'master', 'daktar', 'vaidya', 'hakim', 'abhiyanta', 'vakil', 'nars',
            'शिक्षक', 'अध्यापक', 'डॉक्टर', 'वैद्य', 'इंजीनियर', 'वकील', 'नर्स', 'मैनेजर',
            'promotion', 'salary', 'raise', 'hike', 'bonus', 'office', 'workplace', 'colleague', 'boss',
            'professional', 'corporate', 'organization',
            'vetan', 'tankhwah', 'वेतन', 'तनख्वाह',
            'cm', 'chief minister', 'minister', 'election', 'political', 'government', 'sarpanch', 'mla', 'mp',
            'politician', 'leader', 'bureaucrat', 'officer', 'administrator',
            'mukhyamantri', 'mantri', 'neta', 'sarkar', 'rajneeti', 'चुनाव', 'मुख्यमंत्री', 'मंत्री', 'नेता',
            'goal', 'ambition', 'aspiration', 'dream job', 'career growth', 'skill development',
            'lakshya', 'sapna', 'uddeshya', 'लक्ष्य', 'सपना', 'उद्देश्य',
        ],
        relationship: [
            'love', 'relationship', 'marriage', 'married', 'wedding', 'partner', 'spouse', 'family', 'friend',
            'dating', 'romance', 'romantic', 'boyfriend', 'girlfriend', 'husband', 'wife', 'soulmate',
            'life partner', 'fiancé', 'fiancée', 'engaged', 'couple', 'dating', 'marry',
            'pyaar', 'prem', 'mohabbat', 'shadi', 'vivah', 'sathi', 'pati', 'patni', 'dost', 'parivar',
            'jivan sathi', 'sangini', 'sangat', 'प्रेम', 'प्यार', 'मोहब्बत', 'शादी', 'विवाह', 'साथी',
            'पति', 'पत्नी', 'दोस्त', 'परिवार', 'जीवनसाथी',
            'find love', 'find soulmate', 'find partner', 'get married', 'get engaged',
            'pyaar milna', 'shadi karna', 'vivah karna', 'साथी मिलना', 'शादी करना',
        ],
        money: [
            'money', 'wealth', 'rich', 'richer', 'income', 'financial', 'finances', 'earning', 'earn', 'profit',
            'investment', 'invest', 'savings', 'save', 'fortune', 'affluent', 'prosperity', 'prosperous',
            'million', 'billion', 'dollar', 'rupee', 'abundance', 'debt', 'loan', 'salary', 'hike', 'raise',
            'paisa', 'rupay', 'rupee', 'rupaiya', 'dhan', 'sampatti', 'amiri', 'dhani', 'aay', 'kamai',
            'nivesh', 'bachet', 'udhar', 'karz', 'पैसा', 'रुपये', 'धन', 'संपत्ति', 'अमीर', 'धनी',
            'आय', 'कमाई', 'निवेश', 'बचत', 'उधार', 'कर्ज',
            'become rich', 'get rich', 'earn money', 'make money',
            'amir banna', 'paisa kamana', 'धन कमाना', 'अमीर बनना',
        ],
        health: [
            'health', 'healthy', 'fitness', 'fit', 'weight', 'body', 'disease', 'illness', 'cure', 'medical',
            'wellness', 'wellbeing', 'heal', 'healing', 'recovery', 'recover', 'treatment', 'therapy',
            'exercise', 'diet', 'pain', 'doctor', 'hospital', 'medicine',
            'swasthya', 'tandurusti', 'bimari', 'rog', 'ilaj', 'upchar', 'dawai', 'dava', 'vajan', 'wajan',
            'vyayam', 'kasrat', 'aahar', 'dard', 'स्वास्थ्य', 'तंदुरुस्ती', 'बीमारी', 'रोग', 'इलाज',
            'उपचार', 'दवा', 'वजन', 'व्यायाम', 'कसरत', 'आहार', 'दर्द',
            'fitness goals', 'health goals', 'lose weight', 'gain weight',
            'vajan kam karna', 'vajan badhana', 'swasth rahna', 'वजन कम करना', 'वजन बढ़ाना', 'स्वस्थ रहना',
        ],
        spiritual: [
            'spiritual', 'spirituality', 'meditation', 'meditate', 'peace', 'peaceful', 'enlightenment',
            'enlightened', 'soul', 'divine', 'god', 'prayer', 'pray', 'devotion', 'devotional', 'worship',
            'blessing', 'blessed', 'dharma', 'karma', 'moksha', 'nirvana',
            'adhyatmik', 'adhyatma', 'dhyan', 'shanti', 'atma', 'ishwar', 'bhagwan', 'puja', 'prarthana',
            'bhakti', 'upasana', 'ashirvad', 'धर्म', 'कर्म', 'मोक्ष', 'आध्यात्मिक', 'ध्यान', 'शांति',
            'आत्मा', 'ईश्वर', 'भगवान', 'पूजा', 'प्रार्थना', 'भक्ति', 'उपासना', 'आशीर्वाद',
            'find peace', 'find enlightenment', 'achieve peace',
            'shanti milna', 'moksha pana', 'शांति मिलना', 'मोक्ष पाना',
        ],
        personal: [
            'personal', 'self', 'myself', 'growth', 'development', 'improve', 'improvement', 'transform',
            'transformation', 'change', 'better', 'best', 'confidence', 'self confidence', 'self esteem',
            'personality', 'character', 'habits', 'behavior', 'mindset', 'attitude', 'positive thinking',
            'motivation', 'inspiration', 'success', 'achieve', 'goals', 'dreams', 'aspirations',
            'vyaktigat', 'swayam', 'vikas', 'sudhar', 'badlav', 'sabhyata', 'charitra', 'aadat',
            'vyavhar', 'soch', 'drishtikon', 'sakaratmak', 'prerana', 'safalta', 'लक्ष्य', 'सपने',
            'व्यक्तिगत', 'स्वयं', 'विकास', 'सुधार', 'बदलाव', 'सभ्यता', 'चरित्र', 'आदत',
            'व्यवहार', 'सोच', 'दृष्टिकोण', 'सकारात्मक', 'प्रेरणा', 'सफलता',
        ],
        farming: [
            'farming', 'farm', 'farmer', 'agriculture', 'agricultural', 'crop', 'crops', 'harvest',
            'harvesting', 'cultivation', 'cultivate', 'field', 'fields', 'land', 'farming land',
            'irrigation', 'fertilizer', 'seeds', 'planting', 'sowing', 'reaping', 'yield', 'production',
            'livestock', 'cattle', 'dairy', 'poultry', 'organic', 'organic farming', 'crop yield',
            'agricultural income', 'farm income', 'rural', 'village farming', 'kheti', 'krishi',
            'kheti', 'krishi', 'kisan', 'fasal', 'khet', 'zameen', 'beej', 'bona', 'katayi',
            'sabji', 'anaj', 'dhan', 'gehu', 'chawal', 'makka', 'jowar', 'bajra', 'गेहूं', 'चावल',
            'खेती', 'कृषि', 'किसान', 'फसल', 'खेत', 'जमीन', 'बीज', 'बोना', 'कटाई',
            'सब्जी', 'अनाज', 'धान', 'मक्का', 'ज्वार', 'बाजरा',
            'good harvest', 'better crop', 'more yield', 'agricultural success', 'farm success',
            'अच्छी फसल', 'बेहतर उत्पादन', 'अधिक उपज',
        ],
        family: [
            'family', 'families', 'parent', 'parents', 'father', 'mother', 'dad', 'mom', 'mummy', 'papa',
            'son', 'daughter', 'child', 'children', 'kids', 'sibling', 'siblings', 'brother', 'sister',
            'grandfather', 'grandmother', 'grandpa', 'grandma', 'uncle', 'aunt', 'cousin', 'relatives',
            'home', 'household', 'family harmony', 'family peace', 'family happiness', 'family support',
            'family relationship', 'family bond', 'family unity', 'family togetherness',
            'my family', 'our family', 'family member', 'family members', 'family life', 'family time',
            'parivar', 'ghar', 'maata', 'pita', 'beta', 'beti', 'bhai', 'behen', 'dada', 'dadi',
            'nana', 'nani', 'chacha', 'chachi', 'mama', 'mami', 'rishtedar', 'sambandhi',
            'परिवार', 'घर', 'माता', 'पिता', 'बेटा', 'बेटी', 'भाई', 'बहन', 'दादा', 'दादी',
            'नाना', 'नानी', 'चाचा', 'चाची', 'मामा', 'मामी', 'रिश्तेदार', 'संबंधी',
            'parivar mein shanti', 'ghar mein khushi', 'मेरा परिवार', 'हमारा परिवार',
            'परिवार में शांति', 'घर में खुशी',
        ],
        business: [
            'business', 'businesses', 'businessman', 'businesswoman', 'entrepreneur', 'entrepreneurship',
            'startup', 'start up', 'company', 'companies', 'firm', 'firms', 'enterprise', 'enterprises',
            'venture', 'ventures', 'trade', 'trading', 'commerce', 'commercial', 'profit', 'profits',
            'revenue', 'sales', 'customer', 'customers', 'client', 'clients', 'market', 'marketing',
            'business growth', 'business success', 'business expansion', 'business profit',
            'new business', 'start business', 'own business', 'my business',
            'business owner', 'business partner', 'business plan', 'business model',
            'vyapar', 'dhandha', 'udhyog', 'vyapari', 'udhyogpati', 'vyavasay',
            'vyapar badhana', 'dhandha badhana', 'naya vyapar', 'apna vyapar', 'apna dhandha',
            'व्यापार', 'धंधा', 'उद्योग', 'व्यापारी', 'उद्योगपति', 'व्यवसाय',
            'व्यापार बढ़ाना', 'धंधा बढ़ाना', 'नया व्यापार', 'अपना व्यापार', 'अपना धंधा',
        ],
    };
    let detectedCategory = 'other';
    let maxScore = 0;
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        let score = 0;
        const multiWordKeywords = keywords.filter(kw => kw.includes(' '));
        for (const kw of multiWordKeywords) {
            if (text.includes(kw) || text_normalizer_util_1.TextNormalizer.fuzzyMatch(rawText, kw, 2)) {
                score += 3;
            }
        }
        const singleWordKeywords = keywords.filter(kw => !kw.includes(' '));
        for (const kw of singleWordKeywords) {
            const wordBoundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
            if (wordBoundaryRegex.test(text)) {
                score += 1;
            }
            else {
                if (text_normalizer_util_1.TextNormalizer.fuzzyMatch(rawText, kw, 1)) {
                    score += 0.8;
                }
            }
        }
        if (score > maxScore) {
            maxScore = score;
            detectedCategory = cat;
        }
    }
    return detectedCategory;
}
function runTests() {
    console.log('\n=== Comprehensive Category Detection Tests ===\n');
    let passed = 0;
    let failed = 0;
    const failures = [];
    for (const test of testCases) {
        const detected = detectCategory(test.title, test.description);
        const passedTest = detected === test.expectedCategory;
        if (passedTest) {
            passed++;
            console.log(`✅ ${test.title} (${test.language}) → ${detected}`);
        }
        else {
            failed++;
            failures.push(`❌ ${test.title} (${test.language}) → Expected: ${test.expectedCategory}, Got: ${detected}`);
            console.log(`❌ ${test.title} (${test.language}) → Expected: ${test.expectedCategory}, Got: ${detected}`);
        }
    }
    console.log(`\n=== Results ===`);
    console.log(`Passed: ${passed}/${testCases.length}`);
    console.log(`Failed: ${failed}/${testCases.length}`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);
    if (failures.length > 0) {
        console.log(`\n=== Failures ===`);
        failures.forEach(f => console.log(f));
    }
}
runTests();
//# sourceMappingURL=test-comprehensive-examples.js.map