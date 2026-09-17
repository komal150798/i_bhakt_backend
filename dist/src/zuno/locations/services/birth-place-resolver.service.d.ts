import { GeocodeCandidate, IGeocoder } from '../ports/geocoder.port';
import { TimezoneResolverService } from './timezone-resolver.service';
export type PlaceResolutionStatus = 'RESOLVED' | 'AMBIGUOUS' | 'NOT_FOUND' | 'UNAVAILABLE';
export interface ResolvedPlace extends GeocodeCandidate {
    timezone: string | null;
}
export interface PlaceResolution {
    status: PlaceResolutionStatus;
    candidates: ResolvedPlace[];
    provider: string;
    detail?: string;
}
export declare class BirthPlaceResolverService {
    private readonly geocoder;
    private readonly timezones;
    private readonly logger;
    constructor(geocoder: IGeocoder, timezones: TimezoneResolverService);
    isAvailable(): boolean;
    resolve(query: string, countryCode?: string | null): Promise<PlaceResolution>;
    verifyCoordinate(latitude: number, longitude: number): {
        valid: boolean;
        timezone: string | null;
        reason?: string;
    };
}
