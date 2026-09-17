export declare const EPHEMERIS: unique symbol;
export declare enum Graha {
    SUN = "SUN",
    MOON = "MOON",
    MARS = "MARS",
    MERCURY = "MERCURY",
    JUPITER = "JUPITER",
    VENUS = "VENUS",
    SATURN = "SATURN",
    RAHU = "RAHU",
    KETU = "KETU"
}
export declare const GRAHA_ORDER: readonly Graha[];
export interface GrahaPosition {
    graha: Graha;
    siderealLongitude: number;
    tropicalLongitude: number;
    latitude: number;
    speed: number;
    retrograde: boolean;
    signNumber: number;
    sign: string;
    degreesInSign: number;
    nakshatraNumber: number;
    nakshatra: string;
    pada: number;
    house: number;
    degreesFromSun: number;
}
export interface HouseCusp {
    house: number;
    siderealLongitude: number;
    signNumber: number;
    sign: string;
}
export type HouseSystem = 'WHOLE_SIGN' | 'EQUAL' | 'PLACIDUS';
export interface Ascendant {
    siderealLongitude: number;
    tropicalLongitude: number;
    signNumber: number;
    sign: string;
    degreesInSign: number;
    nakshatraNumber: number;
    nakshatra: string;
    pada: number;
}
export interface DashaPeriod {
    lord: Graha;
    startIso: string;
    endIso: string;
    children?: DashaPeriod[];
}
export interface DashaSnapshot {
    mahadasha: Graha;
    bhukti: Graha;
    antara: Graha;
    mahadashaPeriod: DashaPeriod;
    bhuktiPeriod: DashaPeriod;
    antaraPeriod: DashaPeriod;
}
export interface BirthMoment {
    julianDayUt: number;
    latitude: number;
    longitude: number;
}
export interface ChartOptions {
    ayanamsa: string;
    houseSystem: HouseSystem;
}
export interface NatalChart {
    moment: BirthMoment;
    ascendant: Ascendant;
    houses: HouseCusp[];
    positions: GrahaPosition[];
    dashaAtBirth: DashaSnapshot;
    provenance: {
        engine: string;
        engineVersion: string;
        ayanamsa: string;
        ayanamsaDegrees: number;
        houseSystem: HouseSystem;
        computedAtIso: string;
    };
}
export interface TransitSnapshot {
    julianDayUt: number;
    positions: GrahaPosition[];
    provenance: {
        engine: string;
        ayanamsa: string;
        ayanamsaDegrees: number;
    };
}
export interface IEphemeris {
    readonly engineName: string;
    readonly engineVersion: string;
    readonly supportedRange: {
        fromJulianDay: number;
        toJulianDay: number;
    };
    computeNatalChart(moment: BirthMoment, options: ChartOptions): NatalChart;
    computeTransits(julianDayUt: number, natal: NatalChart, options: ChartOptions): TransitSnapshot;
    computeDashaTimeline(moment: BirthMoment, options: ChartOptions, depth: number): DashaPeriod[];
    dashaAt(moment: BirthMoment, options: ChartOptions, atJulianDayUt: number): DashaSnapshot | null;
}
