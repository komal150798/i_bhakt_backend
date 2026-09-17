import { HouseSystem } from '../ports/ephemeris.port';
export declare function trueObliquity(julianDay: number): number;
export declare function localSiderealDegrees(julianDay: number, longitudeEast: number): number;
export declare function eclipticLongitudeAtRightAscension(rightAscensionDeg: number, obliquityDeg: number): number;
export declare function declinationOfEclipticLongitude(longitudeDeg: number, obliquityDeg: number): number;
export declare function midheaven(ramcDeg: number, obliquityDeg: number): number;
export declare function ascendant(ramcDeg: number, latitudeDeg: number, obliquityDeg: number): number;
export declare class HouseSystemUnavailableError extends Error {
    readonly system: HouseSystem;
    readonly reason: string;
    constructor(system: HouseSystem, reason: string);
}
export declare function computeHouseCusps(system: HouseSystem, ramcDeg: number, latitudeDeg: number, obliquityDeg: number): number[];
export declare function eclipticToHorizontal(longitudeDeg: number, ramcDeg: number, latitudeDeg: number, obliquityDeg: number): {
    altitude: number;
    azimuth: number;
};
