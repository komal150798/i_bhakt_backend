import { GeocodeCandidate, GeocodeQuery, IGeocoder } from '../ports/geocoder.port';
export declare class NullGeocoder implements IGeocoder {
    readonly providerName = "none";
    private readonly logger;
    private warned;
    isConfigured(): boolean;
    search(_query: GeocodeQuery): Promise<GeocodeCandidate[]>;
}
