import { HttpService } from '@nestjs/axios';
import { GeocodeCandidate, GeocodeQuery, IGeocoder } from '../ports/geocoder.port';
export declare class NominatimGeocoder implements IGeocoder {
    private readonly http;
    readonly providerName = "nominatim";
    private readonly logger;
    private queue;
    private lastRequestAt;
    constructor(http: HttpService);
    private get baseUrl();
    private get contact();
    isConfigured(): boolean;
    search(query: GeocodeQuery): Promise<GeocodeCandidate[]>;
    private rateLimited;
}
