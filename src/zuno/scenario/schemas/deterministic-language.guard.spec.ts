import {
  DeterministicClaimKind,
  findDeterministicClaims,
  hasDeterministicClaim,
  isQualitativeProbabilityLabel,
  scanForDeterministicClaims,
} from './deterministic-language.guard';

/**
 * The possibility-language boundary is a release gate for this module, in the
 * same sense that SafetyService is one for the product (Build Rules 99-100).
 *
 * Two halves matter equally:
 *   it must catch the claims the specification prohibits
 *   it must NOT catch ordinary scenario language, or the engine gets pushed
 *   toward vagueness and the guard gets disabled by whoever is on call
 */
describe('deterministic-language guard', () => {
  describe('rejects determined outcomes (Step 12 Rule 1, Step 19 section 7)', () => {
    const guaranteed = [
      'Your promotion is guaranteed once the review completes.',
      'You will definitely be moved to the new team.',
      'There is no doubt that the restructuring lands this quarter.',
      'Without a doubt the role is being removed.',
      'The outcome is certain to happen before December.',
      'Redundancy here is inevitable.',
    ];

    it.each(guaranteed)('flags %j', (text) => {
      const claims = findDeterministicClaims(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0].kind).toBe(DeterministicClaimKind.GUARANTEED_OUTCOME);
    });
  });

  describe('rejects fabricated probability (Step 12 sections 16, 97, Rule 2)', () => {
    // Step 12 section 16's own example of what must never be shown.
    const probabilities = [
      '72% chance of termination',
      'There is a 30 percent likelihood of an internal move.',
      'Scenario A - chance of 20%',
      'probability of 0.7 that the role is cut',
      '3 in 10 chance of a counter-offer',
    ];

    it.each(probabilities)('flags %j', (text) => {
      const claims = findDeterministicClaims(text);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims.map((claim) => claim.kind)).toContain(
        DeterministicClaimKind.NUMERIC_PROBABILITY,
      );
    });

    it('allows a percentage that is a magnitude, not a probability', () => {
      // "a 30% pay cut" is a real quantity and must survive. A blanket ban on
      // the % sign would make the engine unable to describe a salary change.
      expect(hasDeterministicClaim('The offer involved a 30% pay cut.')).toBe(false);
      expect(hasDeterministicClaim('Interest rose by 2 percent this year.')).toBe(
        false,
      );
    });
  });

  describe('rejects prediction (Step 12 Rule 1, sections 21 and 73)', () => {
    const predictions = [
      'You will lose your job next month.',
      'You are going to be fired.',
      'Your marriage will end if nothing changes.',
      'I predict the company closes the office.',
      'This will happen regardless of what you do.',
      'You are destined to move abroad.',
    ];

    it.each(predictions)('flags %j', (text) => {
      expect(hasDeterministicClaim(text)).toBe(true);
    });
  });

  describe('rejects fatalism (Step 19 section 10)', () => {
    const fatalistic = [
      'There is nothing you can do about it.',
      'This cannot be avoided.',
      'There is no way out of the loan.',
      'It is your fate.',
    ];

    it.each(fatalistic)('flags %j', (text) => {
      const claims = findDeterministicClaims(text);
      expect(claims.map((claim) => claim.kind)).toContain(
        DeterministicClaimKind.FATALISM,
      );
    });
  });

  describe('rejects dated certainty (Step 12 section 47)', () => {
    it('flags the specification\'s own example shape', () => {
      // "Your manager will fire you on 18 October" is what section 47 says
      // astrology must never be used to produce.
      expect(
        hasDeterministicClaim('Your manager will fire you on 18 October.'),
      ).toBe(true);
      expect(
        hasDeterministicClaim('The restructuring will happen in October.'),
      ).toBe(true);
      // Asserting a date for an external event is the same claim in calmer
      // words, so it is flagged too.
      expect(hasDeterministicClaim('The consultation will end in March.')).toBe(
        true,
      );
      // The conditional form Step 19 section 44 asks for passes.
      expect(
        hasDeterministicClaim(
          'If the consultation concludes in March, here is what we would want ready.',
        ),
      ).toBe(false);
    });
  });

  describe('permits ordinary scenario language', () => {
    // These are drawn from the specification's own canonical scenario set
    // (Step 12 sections 94-95) and from Step 19 section 44's preferred framing.
    const safe = [
      'Your employment continues while the company completes restructuring.',
      'Role or responsibilities materially change.',
      'Current employment ends.',
      'Another role or income option becomes available before a forced transition.',
      'If the company does reduce your role, here is what we would want ready.',
      'Keep increasing visibility and value.',
      'Make sure Option B is active before you need it.',
      'We will want your CV refreshed either way.',
      'This could go several ways, and preparation helps in all of them.',
      'A formal consultation would make this path more relevant.',
    ];

    it.each(safe)('allows %j', (text) => {
      expect(findDeterministicClaims(text)).toEqual([]);
    });
  });

  describe('scanning nested structures', () => {
    it('finds a claim buried deep in an array of objects', () => {
      const response = {
        scenarios: [
          { title: 'Stay in role', summary: 'Employment continues for now.' },
          {
            title: 'Transition out',
            summary: 'The role ends.',
            risks: ['You will lose your job in November.'],
          },
        ],
      };

      const claims = scanForDeterministicClaims(response);
      expect(claims).toHaveLength(1);
      expect(claims[0].field).toBe('$.scenarios[1].risks[0]');
    });

    it('returns nothing for a clean response', () => {
      expect(
        scanForDeterministicClaims({
          scenarios: [{ title: 'Stay', summary: 'Employment continues.' }],
          shared_preparation: ['Refresh the CV'],
        }),
      ).toEqual([]);
    });

    it('handles null, undefined and non-string leaves without throwing', () => {
      expect(findDeterministicClaims(null)).toEqual([]);
      expect(findDeterministicClaims(undefined)).toEqual([]);
      expect(
        scanForDeterministicClaims({ a: 1, b: true, c: null, d: undefined }),
      ).toEqual([]);
    });
  });

  describe('probability labels', () => {
    it('accepts the qualitative vocabulary from Step 12 section 16', () => {
      expect(isQualitativeProbabilityLabel('PRIMARY')).toBe(true);
      expect(isQualitativeProbabilityLabel('PLAUSIBLE')).toBe(true);
      expect(isQualitativeProbabilityLabel('SECONDARY')).toBe(true);
      expect(isQualitativeProbabilityLabel('CONTINGENCY')).toBe(true);
      expect(isQualitativeProbabilityLabel(null)).toBe(true);
    });

    it('refuses anything containing a digit', () => {
      expect(isQualitativeProbabilityLabel('72%')).toBe(false);
      expect(isQualitativeProbabilityLabel('PRIMARY_80')).toBe(false);
      expect(isQualitativeProbabilityLabel('0.7')).toBe(false);
    });

    it('refuses a word outside the approved vocabulary', () => {
      expect(isQualitativeProbabilityLabel('LIKELY')).toBe(false);
      expect(isQualitativeProbabilityLabel('PREDICTED')).toBe(false);
    });
  });
});
