"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODEL_PRICING = exports.UNPRICED_VERSION = exports.PRICING_VERSION = void 0;
exports.parsePricingOverride = parsePricingOverride;
exports.PRICING_VERSION = 'seed-2026-09';
exports.UNPRICED_VERSION = 'UNPRICED';
const usdPerMillion = (input, output) => ({
    inputMicrosPerMillion: Math.round(input * 1_000_000),
    outputMicrosPerMillion: Math.round(output * 1_000_000),
});
exports.DEFAULT_MODEL_PRICING = {
    'openai:gpt-4o': usdPerMillion(2.5, 10),
    'openai:gpt-4o-mini': usdPerMillion(0.15, 0.6),
    'openai:gpt-4.1': usdPerMillion(2, 8),
    'openai:gpt-4.1-mini': usdPerMillion(0.4, 1.6),
    'openai:gpt-4.1-nano': usdPerMillion(0.1, 0.4),
    'openai:gpt-4-turbo': usdPerMillion(10, 30),
    'openai:gpt-3.5-turbo': usdPerMillion(0.5, 1.5),
    'openai:o3-mini': usdPerMillion(1.1, 4.4),
    'claude:claude-3-5-haiku': usdPerMillion(0.8, 4),
    'claude:claude-3-5-sonnet': usdPerMillion(3, 15),
    'claude:claude-3-7-sonnet': usdPerMillion(3, 15),
    'claude:claude-3-haiku': usdPerMillion(0.25, 1.25),
    'claude:claude-3-opus': usdPerMillion(15, 75),
    'gemini:gemini-1.5-flash': usdPerMillion(0.075, 0.3),
    'gemini:gemini-1.5-pro': usdPerMillion(1.25, 5),
    'gemini:gemini-2.0-flash': usdPerMillion(0.1, 0.4),
};
function parsePricingOverride(raw) {
    if (!raw || !raw.trim())
        return null;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object')
        return null;
    const candidate = parsed;
    if (typeof candidate.version !== 'string' || !candidate.version.trim())
        return null;
    if (!candidate.prices || typeof candidate.prices !== 'object')
        return null;
    const prices = {};
    for (const [key, value] of Object.entries(candidate.prices)) {
        if (!value || typeof value !== 'object')
            return null;
        const entry = value;
        if (typeof entry.input !== 'number' || typeof entry.output !== 'number')
            return null;
        if (!Number.isFinite(entry.input) || !Number.isFinite(entry.output))
            return null;
        if (entry.input < 0 || entry.output < 0)
            return null;
        prices[key.trim().toLowerCase()] = usdPerMillion(entry.input, entry.output);
    }
    if (Object.keys(prices).length === 0)
        return null;
    return { version: candidate.version.trim(), prices };
}
//# sourceMappingURL=model-pricing.js.map