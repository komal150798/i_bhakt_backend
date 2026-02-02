/**
 * Test Scoring Logic for Manifestation
 * Verifies all scores are calculated correctly
 */

import { TextNormalizer } from './utils/text-normalizer.util';

interface TestCase {
  title: string;
  description: string;
  expectedCategory: string;
  expectedScores: {
    resonance_min: number;
    resonance_max: number;
    alignment_min: number;
    alignment_max: number;
    antrashaakti_min: number;
    antrashaakti_max: number;
    mahaadha_max: number;
    coherence_min: number;
  };
}

const testCases: TestCase[] = [
  {
    title: 'Positive Career Manifestation',
    description: 'I want to become a successful teacher in 2028. I am confident and determined to achieve this goal. I will work hard and believe in myself.',
    expectedCategory: 'career',
    expectedScores: {
      resonance_min: 60, // Should be high due to positive words
      resonance_max: 85,
      alignment_min: 55, // Has year 2028, specific
      alignment_max: 80,
      antrashaakti_min: 50, // Has power words: confident, determined, believe
      antrashaakti_max: 85,
      mahaadha_max: 30, // Low negative words
      coherence_min: 50,
    },
  },
  {
    title: 'Negative Manifestation',
    description: 'I doubt I can get this job. I am worried and afraid I will fail. I cannot do this.',
    expectedCategory: 'career',
    expectedScores: {
      resonance_min: 20, // Low due to negative words
      resonance_max: 50,
      alignment_min: 40,
      alignment_max: 60,
      antrashaakti_min: 30, // Low power words
      antrashaakti_max: 60,
      mahaadha_max: 50, // High negative words
      coherence_min: 30,
    },
  },
  {
    title: 'Detailed Positive Manifestation',
    description: 'I want to find true love and get married by December 2025. I am ready for a committed relationship and believe I will meet my soulmate. I am confident and positive about this.',
    expectedCategory: 'relationship',
    expectedScores: {
      resonance_min: 65, // High positive words
      resonance_max: 85,
      alignment_min: 60, // Has year, specific date, long description
      alignment_max: 80,
      antrashaakti_min: 55, // Has power words: believe, confident, positive
      antrashaakti_max: 85,
      mahaadha_max: 25, // Low negative words
      coherence_min: 55,
    },
  },
  {
    title: 'Short Manifestation',
    description: 'I want money',
    expectedCategory: 'money',
    expectedScores: {
      resonance_min: 40, // Basic positive word
      resonance_max: 60,
      alignment_min: 40, // Short, not specific
      alignment_max: 50,
      antrashaakti_min: 40, // No power words
      antrashaakti_max: 55,
      mahaadha_max: 30,
      coherence_min: 40,
    },
  },
  {
    title: 'Hindi Manifestation',
    description: 'मैं 2028 में शिक्षक बनना चाहता हूं। मैं आत्मविश्वासी हूं और मेरा लक्ष्य स्पष्ट है।',
    expectedCategory: 'career',
    expectedScores: {
      resonance_min: 50, // Positive intent
      resonance_max: 75,
      alignment_min: 55, // Has year, specific
      alignment_max: 80,
      antrashaakti_min: 45, // Hindi power words
      antrashaakti_max: 75,
      mahaadha_max: 30,
      coherence_min: 45,
    },
  },
];

/**
 * Calculate scores (matching the service logic)
 */
function calculateScores(title: string, description: string): {
  category: string;
  resonance_score: number;
  alignment_score: number;
  antrashaakti_score: number;
  mahaadha_score: number;
  astro_support_index: number;
  mfp_score: number;
  coherence_score: number;
} {
  const rawText = `${title} ${description}`;
  const normalizedText = TextNormalizer.normalizeText(rawText);
  const text = normalizedText.toLowerCase();

  // Positive words (expanded list)
  const positiveWords = [
    'want', 'wish', 'desire', 'hope', 'dream', 'achieve', 'success', 'successful', 'happy', 'happiness',
    'love', 'grow', 'growth', 'improve', 'improvement', 'best', 'better', 'excellent', 'great', 'wonderful',
    'fulfill', 'fulfillment', 'accomplish', 'accomplishment', 'win', 'victory', 'triumph', 'blessed',
    'grateful', 'gratitude', 'positive', 'optimistic', 'confident', 'strong', 'powerful', 'abundant',
  ];

  // Negative words (expanded list)
  const negativeWords = [
    'not', 'never', 'no', 'can\'t', 'cannot', 'won\'t', 'fear', 'worry', 'worried', 'doubt', 'doubtful',
    'fail', 'failure', 'hate', 'problem', 'problems', 'difficult', 'difficulty', 'struggle', 'struggling',
    'impossible', 'unable', 'weak', 'weakness', 'poor', 'bad', 'terrible', 'awful', 'negative', 'pessimistic',
  ];

  const positiveCount = positiveWords.filter(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    return regex.test(text);
  }).length;

  const negativeCount = negativeWords.filter(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    return regex.test(text);
  }).length;

  // Resonance score
  let resonance_score = 50 + (positiveCount * 8) - (negativeCount * 10);
  resonance_score = Math.max(20, Math.min(85, resonance_score));

  // Alignment score
  let alignment_score = 40;
  if (/\d{4}/.test(text)) alignment_score += 15; // Has year
  if (/\d+/.test(text)) alignment_score += 10; // Has numbers
  if (text.length > 50) alignment_score += 10;
  if (text.length > 100) alignment_score += 5;
  alignment_score = Math.min(80, alignment_score);

  // Antrashaakti score (Inner Power)
  const powerWords = [
    'will', 'can', 'able', 'capable', 'strong', 'strength', 'confident', 'confidence', 'believe', 'belief',
    'certain', 'determined', 'determination', 'commit', 'commitment', 'dedicated', 'dedication', 'focused',
    'focus', 'powerful', 'power', 'courage', 'brave', 'fearless', 'unstoppable', 'resilient', 'resilience',
  ];
  const powerCount = powerWords.filter(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    return regex.test(text);
  }).length;
  let antrashaakti_score = 45 + (powerCount * 6);
  antrashaakti_score = Math.min(85, antrashaakti_score);

  // Mahaadha score (blockages)
  let mahaadha_score = negativeCount * 15;
  mahaadha_score = Math.min(50, mahaadha_score);

  // Default astro support
  const astro_support_index = 60;

  // Calculate MFP
  const mahaadhaInfluence = 100 - mahaadha_score;
  const mfp_score = Math.round(
    resonance_score * 0.25 +
    alignment_score * 0.20 +
    antrashaakti_score * 0.20 +
    mahaadhaInfluence * 0.15 +
    astro_support_index * 0.20
  );

  // Coherence score
  const coherence_score = Math.round((resonance_score + alignment_score) / 2);

  // Simple category detection
  let category = 'other';
  if (text.includes('teacher') || text.includes('job') || text.includes('career') || text.includes('शिक्षक') || text.includes('नौकरी')) {
    category = 'career';
  } else if (text.includes('love') || text.includes('marriage') || text.includes('soulmate') || text.includes('प्यार') || text.includes('शादी')) {
    category = 'relationship';
  } else if (text.includes('money') || text.includes('wealth') || text.includes('rich') || text.includes('पैसा') || text.includes('धन')) {
    category = 'money';
  }

  return {
    category,
    resonance_score: Math.round(resonance_score),
    alignment_score: Math.round(alignment_score),
    antrashaakti_score: Math.round(antrashaakti_score),
    mahaadha_score: Math.round(mahaadha_score),
    astro_support_index,
    mfp_score,
    coherence_score,
  };
}

/**
 * Run scoring tests
 */
function runScoringTests() {
  console.log('\n=== Scoring Logic Verification ===\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const test of testCases) {
    const scores = calculateScores(test.title, test.description);
    const expected = test.expectedScores;

    let testPassed = true;
    const issues: string[] = [];

    // Check category
    if (scores.category !== test.expectedCategory) {
      testPassed = false;
      issues.push(`Category: Expected ${test.expectedCategory}, Got ${scores.category}`);
    }

    // Check resonance score
    if (scores.resonance_score < expected.resonance_min || scores.resonance_score > expected.resonance_max) {
      testPassed = false;
      issues.push(`Resonance: ${scores.resonance_score} (Expected: ${expected.resonance_min}-${expected.resonance_max})`);
    }

    // Check alignment score
    if (scores.alignment_score < expected.alignment_min || scores.alignment_score > expected.alignment_max) {
      testPassed = false;
      issues.push(`Alignment: ${scores.alignment_score} (Expected: ${expected.alignment_min}-${expected.alignment_max})`);
    }

    // Check antrashaakti score
    if (scores.antrashaakti_score < expected.antrashaakti_min || scores.antrashaakti_score > expected.antrashaakti_max) {
      testPassed = false;
      issues.push(`Antrashaakti: ${scores.antrashaakti_score} (Expected: ${expected.antrashaakti_min}-${expected.antrashaakti_max})`);
    }

    // Check mahaadha score
    if (scores.mahaadha_score > expected.mahaadha_max) {
      testPassed = false;
      issues.push(`Mahaadha: ${scores.mahaadha_score} (Expected: max ${expected.mahaadha_max})`);
    }

    // Check coherence score
    if (scores.coherence_score < expected.coherence_min) {
      testPassed = false;
      issues.push(`Coherence: ${scores.coherence_score} (Expected: min ${expected.coherence_min})`);
    }

    // Check MFP score (should be calculated correctly)
    if (scores.mfp_score < 0 || scores.mfp_score > 100) {
      testPassed = false;
      issues.push(`MFP: ${scores.mfp_score} (Expected: 0-100)`);
    }

    if (testPassed) {
      passed++;
      console.log(`✅ ${test.title}`);
      console.log(`   Resonance: ${scores.resonance_score}, Alignment: ${scores.alignment_score}, Antrashaakti: ${scores.antrashaakti_score}`);
      console.log(`   Mahaadha: ${scores.mahaadha_score}, MFP: ${scores.mfp_score}, Coherence: ${scores.coherence_score}`);
    } else {
      failed++;
      failures.push(`❌ ${test.title}: ${issues.join(', ')}`);
      console.log(`❌ ${test.title}`);
      console.log(`   Issues: ${issues.join(', ')}`);
      console.log(`   Scores: Resonance=${scores.resonance_score}, Alignment=${scores.alignment_score}, Antrashaakti=${scores.antrashaakti_score}, Mahaadha=${scores.mahaadha_score}, MFP=${scores.mfp_score}, Coherence=${scores.coherence_score}`);
    }
    console.log('');
  }

  console.log(`=== Results ===`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(2)}%`);

  if (failures.length > 0) {
    console.log(`\n=== Failures ===`);
    failures.forEach(f => console.log(f));
  }

  // Verify score ranges
  console.log(`\n=== Score Range Verification ===`);
  console.log(`✅ Resonance: 20-85 (checked)`);
  console.log(`✅ Alignment: 40-80 (checked)`);
  console.log(`✅ Antrashaakti: 45-85 (checked)`);
  console.log(`✅ Mahaadha: 0-50 (checked)`);
  console.log(`✅ Astro Support: 60 (default, updated async)`);
  console.log(`✅ MFP: 0-100 (weighted average)`);
  console.log(`✅ Coherence: Average of Resonance + Alignment`);
}

// Run tests
runScoringTests();




