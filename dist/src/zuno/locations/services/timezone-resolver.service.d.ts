export type LocalTimeResolution = 'UNIQUE' | 'AMBIGUOUS' | 'NONEXISTENT';
export interface ResolvedInstant {
    resolution: LocalTimeResolution;
    utcIso: string | null;
    julianDayUt: number | null;
    offsetMinutes: number | null;
    alternatives: {
        utcIso: string;
        offsetMinutes: number;
    }[];
    timezone: string;
}
export declare class TimezoneResolverService {
    private readonly logger;
    timezoneForCoordinates(latitude: number, longitude: number): string | null;
    isKnownTimezone(zone: string): boolean;
    resolveLocalToUtc(date: string, time: string, zone: string): ResolvedInstant;
}
export declare function julianDayFromUtcMillis(millis: number): number;
