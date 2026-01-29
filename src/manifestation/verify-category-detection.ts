/**
 * Verification Script for Manifestation Category Detection
 * Run this to test category detection with multiple examples
 */

interface TestCase {
  title: string;
  description: string;
  expectedCategory: string;
  expectedKeywords: string[];
}

const testCases: TestCase[] = [
  // Career Examples
  {
    title: 'I want to become a teacher',
    description: 'I want to become a teacher in 2028',
    expectedCategory: 'career',
    expectedKeywords: ['become', 'teacher'],
  },
  {
    title: 'Get a job',
    description: 'I want to get a job as a software engineer',
    expectedCategory: 'career',
    expectedKeywords: ['get', 'job', 'software engineer'],
  },
  {
    title: 'Career promotion',
    description: 'I want to achieve my career goals and get promoted',
    expectedCategory: 'career',
    expectedKeywords: ['career', 'goals', 'promoted'],
  },
  {
    title: 'Start business',
    description: 'I want to start my own business',
    expectedCategory: 'career',
    expectedKeywords: ['business'],
  },
  {
    title: 'Become doctor',
    description: 'I want to become a doctor',
    expectedCategory: 'career',
    expectedKeywords: ['become', 'doctor'],
  },
  {
    title: 'Chief Minister',
    description: 'I want to become Chief Minister',
    expectedCategory: 'career',
    expectedKeywords: ['become', 'chief minister'],
  },
  {
    title: 'Manager position',
    description: 'I want to get a position as a manager',
    expectedCategory: 'career',
    expectedKeywords: ['get', 'position', 'manager'],
  },
  {
    title: 'Software developer',
    description: 'I want to become a software developer',
    expectedCategory: 'career',
    expectedKeywords: ['become', 'developer'],
  },
  {
    title: 'Career growth',
    description: 'I want career growth and skill development',
    expectedCategory: 'career',
    expectedKeywords: ['career growth', 'skill development'],
  },
  
  // Relationship Examples
  {
    title: 'Find soulmate',
    description: 'I want to find my soulmate',
    expectedCategory: 'relationship',
    expectedKeywords: ['soulmate'],
  },
  {
    title: 'Get married',
    description: 'I want to get married',
    expectedCategory: 'relationship',
    expectedKeywords: ['married', 'marriage'],
  },
  {
    title: 'Find love',
    description: 'I want to find love',
    expectedCategory: 'relationship',
    expectedKeywords: ['love'],
  },
  {
    title: 'Happy relationship',
    description: 'I want a happy relationship',
    expectedCategory: 'relationship',
    expectedKeywords: ['relationship'],
  },
  {
    title: 'Life partner',
    description: 'I want to find my life partner',
    expectedCategory: 'relationship',
    expectedKeywords: ['partner'],
  },
  
  // Money/Wealth Examples
  {
    title: 'Earn money',
    description: 'I want to earn more money',
    expectedCategory: 'money',
    expectedKeywords: ['earn', 'money'],
  },
  {
    title: 'Become rich',
    description: 'I want to become rich',
    expectedCategory: 'money',
    expectedKeywords: ['rich'],
  },
  {
    title: 'Financial freedom',
    description: 'I want financial freedom',
    expectedCategory: 'money',
    expectedKeywords: ['financial'],
  },
  {
    title: 'Increase income',
    description: 'I want to increase my income',
    expectedCategory: 'money',
    expectedKeywords: ['income'],
  },
  {
    title: 'Wealth and prosperity',
    description: 'I want wealth and prosperity',
    expectedCategory: 'money',
    expectedKeywords: ['wealth', 'prosperity'],
  },
  
  // Health Examples
  {
    title: 'Lose weight',
    description: 'I want to lose weight',
    expectedCategory: 'health',
    expectedKeywords: ['weight'],
  },
  {
    title: 'Be healthy',
    description: 'I want to be healthy',
    expectedCategory: 'health',
    expectedKeywords: ['healthy', 'health'],
  },
  {
    title: 'Cure disease',
    description: 'I want to cure my disease',
    expectedCategory: 'health',
    expectedKeywords: ['cure', 'disease'],
  },
  {
    title: 'Fitness goals',
    description: 'I want to achieve my fitness goals',
    expectedCategory: 'health',
    expectedKeywords: ['fitness'],
  },
  
  // Spiritual Examples
  {
    title: 'Find peace',
    description: 'I want to find peace',
    expectedCategory: 'spiritual',
    expectedKeywords: ['peace'],
  },
  {
    title: 'Spiritual growth',
    description: 'I want spiritual growth',
    expectedCategory: 'spiritual',
    expectedKeywords: ['spiritual'],
  },
  {
    title: 'Meditation',
    description: 'I want to practice meditation',
    expectedCategory: 'spiritual',
    expectedKeywords: ['meditation'],
  },
  
  // Edge Cases
  {
    title: 'Mixed career and love',
    description: 'I want to become a teacher and find love',
    expectedCategory: 'career', // Should prioritize based on stronger match
    expectedKeywords: ['become', 'teacher'],
  },
  {
    title: 'Generic success',
    description: 'I want success',
    expectedCategory: 'other', // Ambiguous
    expectedKeywords: [],
  },
  {
    title: 'Achieve dreams',
    description: 'I want to achieve my dreams',
    expectedCategory: 'other', // Generic
    expectedKeywords: [],
  },
];

/**
 * Test category detection logic
 */
function testCategoryDetection() {
  const categoryKeywords: Record<string, string[]> = {
    career: [
      'job', 'career', 'work', 'employment', 'profession', 'occupation', 'position', 'role', 'post',
      'become', 'obtain', 'secure', 'land', 'apply', 'interview', 'promote', 'promotion',
      'teacher', 'doctor', 'engineer', 'lawyer', 'nurse', 'accountant', 'manager', 'director', 'executive',
      'developer', 'programmer', 'designer', 'artist', 'writer', 'journalist', 'consultant', 'analyst',
      'scientist', 'researcher', 'professor', 'lecturer', 'coach', 'trainer', 'instructor', 'mentor',
      'business', 'promotion', 'salary', 'raise', 'hike', 'bonus', 'office', 'workplace', 'colleague', 'boss',
      'professional', 'corporate', 'company', 'organization', 'firm', 'enterprise',
      'cm', 'chief minister', 'minister', 'election', 'political', 'government', 'sarpanch', 'mla', 'mp',
      'politician', 'leader', 'bureaucrat', 'officer', 'administrator',
      'goal', 'ambition', 'aspiration', 'dream job', 'career growth', 'skill development',
    ],
      relationship: [
        'love', 'relationship', 'marriage', 'married', 'wedding', 'partner', 'spouse', 'family', 'friend', 
        'dating', 'romance', 'romantic', 'boyfriend', 'girlfriend', 'husband', 'wife', 'soulmate', 
        'life partner', 'fiancé', 'fiancée', 'engaged', 'couple', 'dating', 'marry',
        'find love', 'find soulmate', 'find partner', 'get married', 'get engaged',
      ],
      money: [
        'money', 'wealth', 'rich', 'richer', 'income', 'financial', 'finances', 'earning', 'earn', 'profit', 
        'investment', 'invest', 'savings', 'save', 'fortune', 'affluent', 'prosperity', 'prosperous', 
        'million', 'billion', 'dollar', 'rupee', 'abundance', 'debt', 'loan', 'salary', 'hike', 'raise',
        'become rich', 'get rich', 'earn money', 'make money',
      ],
      health: [
        'health', 'healthy', 'fitness', 'fit', 'weight', 'body', 'disease', 'illness', 'cure', 'medical', 
        'wellness', 'wellbeing', 'heal', 'healing', 'recovery', 'recover', 'treatment', 'therapy', 
        'exercise', 'diet', 'pain', 'doctor', 'hospital', 'medicine',
        'fitness goals', 'health goals', 'lose weight', 'gain weight',
      ],
      spiritual: [
        'spiritual', 'spirituality', 'meditation', 'meditate', 'peace', 'peaceful', 'enlightenment', 
        'enlightened', 'soul', 'divine', 'god', 'prayer', 'pray', 'devotion', 'devotional', 'worship', 
        'blessing', 'blessed', 'dharma', 'karma', 'moksha', 'nirvana',
        'find peace', 'find enlightenment', 'achieve peace',
      ],
  };

  function detectCategory(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    let detectedCategory = 'other';
    let maxScore = 0;
    
    // Calculate scores for each category
    // IMPORTANT: Check multi-word phrases FIRST (they're more specific and should win)
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      
      // First pass: Check multi-word phrases (higher priority, more specific)
      const multiWordKeywords = keywords.filter(kw => kw.includes(' '));
      for (const kw of multiWordKeywords) {
        if (text.includes(kw)) {
          score += 3; // Multi-word matches are very specific, give highest weight
        }
      }
      
      // Second pass: Check single words (lower priority)
      const singleWordKeywords = keywords.filter(kw => !kw.includes(' '));
      for (const kw of singleWordKeywords) {
        // For single words, check for word boundary to avoid false matches
        const wordBoundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
        if (wordBoundaryRegex.test(text)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = cat;
      }
    }
    
    // Fallback for career - only if no category detected AND has strong career indicators WITH career nouns
    if (detectedCategory === 'other' && maxScore === 0) {
      const strongCareerVerbs = ['become', 'obtain', 'secure', 'land', 'apply', 'interview', 'promote'];
      const genericVerbs = ['get', 'find', 'achieve'];
      const careerNouns = ['job', 'position', 'role', 'career', 'profession', 'work', 'employment', 'business', 'office', 'promotion'];
      
      const hasStrongCareerVerb = strongCareerVerbs.some(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'i');
        return regex.test(text);
      });
      
      const hasCareerNoun = careerNouns.some(noun => {
        const regex = new RegExp(`\\b${noun}\\b`, 'i');
        return regex.test(text);
      });
      
      // Only apply career fallback if has career noun (prevents "achieve dreams" from being career)
      if ((hasStrongCareerVerb && hasCareerNoun) || (hasCareerNoun && genericVerbs.some(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'i');
        return regex.test(text);
      }))) {
        detectedCategory = 'career';
      }
    }
    
    return detectedCategory;
  }

  console.log('=== Testing Category Detection ===\n');
  
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  testCases.forEach((testCase, index) => {
    const detected = detectCategory(testCase.title, testCase.description);
    const passedTest = detected === testCase.expectedCategory;
    
    if (passedTest) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.title}" → ${detected}`);
    } else {
      failed++;
      failures.push(`Test ${index + 1}: "${testCase.title}" → Expected: ${testCase.expectedCategory}, Got: ${detected}`);
      console.log(`❌ Test ${index + 1}: "${testCase.title}" → Expected: ${testCase.expectedCategory}, Got: ${detected}`);
    }
  });

  console.log(`\n=== Results ===`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);
  
  if (failures.length > 0) {
    console.log(`\n=== Failures ===`);
    failures.forEach(f => console.log(f));
  }
}

// Run tests
testCategoryDetection();

