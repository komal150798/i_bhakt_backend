import { AiPricingService } from './ai-pricing.service';
import { PRICING_VERSION, UNPRICED_VERSION } from '../pricing/model-pricing';

describe('AiPricingService', () => {
  let service: AiPricingService;
  const originalEnv = process.env.ZUNO_AI_PRICING_JSON;

  beforeEach(() => {
    delete process.env.ZUNO_AI_PRICING_JSON;
    service = new AiPricingService();
    service.load();
  });

  afterAll(() => {
    if (originalEnv === undefined) delete process.env.ZUNO_AI_PRICING_JSON;
    else process.env.ZUNO_AI_PRICING_JSON = originalEnv;
  });

  describe('an unknown model is never treated as free', () => {
    /**
     * The single most important behaviour in this class. Zero would mean "this
     * call cost nothing", which understates spend exactly when a new model is
     * rolled out and nobody is watching.
     */
    it('returns null cost and UNPRICED for a model with no price', () => {
      const result = service.computeCost('openai', 'some-unreleased-model', {
        prompt_tokens: 10_000,
        completion_tokens: 5_000,
      });
      expect(result.costMicroUsd).toBeNull();
      expect(result.pricingVersion).toBe(UNPRICED_VERSION);
    });

    it('returns null when the provider reported no usage at all', () => {
      const result = service.computeCost('openai', 'gpt-4o', null);
      expect(result.costMicroUsd).toBeNull();
      expect(result.pricingVersion).toBe(UNPRICED_VERSION);
    });

    it('returns null for an unknown provider', () => {
      expect(
        service.computeCost('someprovider', 'gpt-4o', { total_tokens: 100 })
          .costMicroUsd,
      ).toBeNull();
    });
  });

  describe('cost arithmetic', () => {
    it('prices input and output at their separate rates', () => {
      // gpt-4o seed: $2.50 in / $10.00 out per million tokens.
      // 1M in + 1M out = $12.50 = 12,500,000 micro-USD.
      const result = service.computeCost('openai', 'gpt-4o', {
        prompt_tokens: 1_000_000,
        completion_tokens: 1_000_000,
      });
      expect(result.costMicroUsd).toBe(12_500_000);
      expect(result.pricingVersion).toBe(PRICING_VERSION);
    });

    it('returns an integer number of micro-USD', () => {
      const result = service.computeCost('openai', 'gpt-4o-mini', {
        prompt_tokens: 1_234,
        completion_tokens: 567,
      });
      expect(Number.isInteger(result.costMicroUsd)).toBe(true);
    });

    it('costs nothing for a call that used no tokens', () => {
      const result = service.computeCost('openai', 'gpt-4o', {
        prompt_tokens: 0,
        completion_tokens: 0,
      });
      expect(result.costMicroUsd).toBe(0);
    });

    /**
     * With only a total, the input/output split is unknown. Pricing it at the
     * more expensive output rate errs high - safe for a pricing decision in a
     * way that erring low is not.
     */
    it('prices a total-only usage block at the output rate', () => {
      const result = service.computeCost('openai', 'gpt-4o', {
        total_tokens: 1_000_000,
      });
      expect(result.costMicroUsd).toBe(10_000_000);
    });

    it('ignores negative or non-finite token counts', () => {
      expect(
        service.computeCost('openai', 'gpt-4o', {
          prompt_tokens: -5,
          completion_tokens: NaN,
          total_tokens: 100,
        }).costMicroUsd,
      ).toBe(1_000);
    });
  });

  describe('model family matching', () => {
    it('matches a dated snapshot to its family', () => {
      const dated = service.findPrice('openai', 'gpt-4o-mini-2024-07-18');
      const family = service.findPrice('openai', 'gpt-4o-mini');
      expect(dated).toEqual(family);
    });

    /**
     * gpt-4o-mini must never be priced as gpt-4o - they differ by about 17x, so
     * a first-match-wins lookup would inflate reported cost enormously.
     */
    it('prefers the longest matching family, not the first', () => {
      const mini = service.findPrice('openai', 'gpt-4o-mini-2024-07-18');
      const full = service.findPrice('openai', 'gpt-4o');
      expect(mini!.inputMicrosPerMillion).toBeLessThan(full!.inputMicrosPerMillion);
    });

    it('is case insensitive on provider and model', () => {
      expect(service.findPrice('OpenAI', 'GPT-4O')).toEqual(
        service.findPrice('openai', 'gpt-4o'),
      );
    });

    it('does not match a family across providers', () => {
      expect(service.findPrice('gemini', 'gpt-4o')).toBeNull();
    });
  });

  describe('operator override', () => {
    it('replaces the table and reports the operator version', () => {
      process.env.ZUNO_AI_PRICING_JSON = JSON.stringify({
        version: 'invoice-2026-Q3',
        prices: { 'openai:gpt-4o': { input: 1, output: 2 } },
      });
      service.load();

      expect(service.isUsingOverride()).toBe(true);
      expect(service.getVersion()).toBe('invoice-2026-Q3');

      const result = service.computeCost('openai', 'gpt-4o', {
        prompt_tokens: 1_000_000,
        completion_tokens: 1_000_000,
      });
      expect(result.costMicroUsd).toBe(3_000_000);
      expect(result.pricingVersion).toBe('invoice-2026-Q3');
    });

    /**
     * An override REPLACES rather than merges. Merging would leave stale
     * built-in prices quietly in force for models the operator believed they
     * had just re-priced.
     */
    it('does not leave built-in prices in force alongside an override', () => {
      process.env.ZUNO_AI_PRICING_JSON = JSON.stringify({
        version: 'partial',
        prices: { 'openai:gpt-4o': { input: 1, output: 2 } },
      });
      service.load();
      expect(service.findPrice('claude', 'claude-3-opus')).toBeNull();
    });

    it('falls back to the built-in table when the override is malformed', () => {
      for (const bad of [
        'not json',
        '{"prices":{}}', // no version
        '{"version":"v","prices":{"openai:gpt-4o":{"input":"free","output":1}}}',
        '{"version":"v","prices":{"openai:gpt-4o":{"input":-1,"output":1}}}',
      ]) {
        process.env.ZUNO_AI_PRICING_JSON = bad;
        service.load();
        expect(service.isUsingOverride()).toBe(false);
        expect(service.getVersion()).toBe(PRICING_VERSION);
      }
    });
  });

  describe('seed prices are flagged as unverified', () => {
    it('reports that the built-in table is not operator-verified', () => {
      expect(service.isUsingOverride()).toBe(false);
    });
  });
});
