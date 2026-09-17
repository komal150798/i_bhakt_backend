import { HttpService } from '@nestjs/axios';
import { GeocodeCandidate, GeocodeQuery, IGeocoder } from '../ports/geocoder.port';
export declare class OpenCageGeocoder implements IGeocoder {
    private readonly http;
    readonly providerName = "opencage";
    private readonly logger;
    constructor(http: HttpService);
    private get apiKey();
    isConfigured(): boolean;
    search(query: GeocodeQuery): Promise<GeocodeCandidate[]>;
}
