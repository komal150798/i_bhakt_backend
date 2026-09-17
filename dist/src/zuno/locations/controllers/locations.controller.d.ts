import { ZunoPayload } from '../../common/interceptors/zuno-response.interceptor';
import { BirthPlaceResolverService } from '../services/birth-place-resolver.service';
export declare class ZunoLocationsController {
    private readonly places;
    constructor(places: BirthPlaceResolverService);
    search(q?: string, country?: string): Promise<ZunoPayload<{
        name: string;
        displayName: string;
        latitude: number;
        longitude: number;
        countryCode: string;
        timezone: string;
        confidence: import("../ports/geocoder.port").GeocodeConfidence;
        featureType: string;
    }[]>>;
    availability(): Promise<ZunoPayload<{
        available: boolean;
    }>>;
}
