export declare const PRICING_VERSION = "seed-2026-09";
export declare const UNPRICED_VERSION = "UNPRICED";
export interface ModelPrice {
    inputMicrosPerMillion: number;
    outputMicrosPerMillion: number;
}
export type PriceTable = Record<string, ModelPrice>;
export declare const DEFAULT_MODEL_PRICING: PriceTable;
export declare function parsePricingOverride(raw: string | undefined): {
    version: string;
    prices: PriceTable;
} | null;
