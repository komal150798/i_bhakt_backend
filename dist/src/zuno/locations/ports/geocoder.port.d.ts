export declare const GEOCODER: unique symbol;
export type GeocodeConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export interface GeocodeCandidate {
    displayName: string;
    name: string;
    latitude: number;
    longitude: number;
    countryCode: string | null;
    providerPlaceId: string | null;
    confidence: GeocodeConfidence;
    featureType: string | null;
}
export interface GeocodeQuery {
    query: string;
    countryCode?: string | null;
    limit?: number;
}
export interface IGeocoder {
    readonly providerName: string;
    isConfigured(): boolean;
    search(query: GeocodeQuery): Promise<GeocodeCandidate[]>;
}
