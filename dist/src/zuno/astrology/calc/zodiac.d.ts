import { Graha } from '../ports/ephemeris.port';
export declare function normaliseDegrees(value: number): number;
export declare function angularSeparation(a: number, b: number): number;
export declare const SIGNS: readonly string[];
export declare const SIGN_LORDS: readonly Graha[];
export declare const NAKSHATRAS: readonly string[];
export declare const NAKSHATRA_SPAN: number;
export declare const PADA_SPAN: number;
export interface SignPosition {
    signNumber: number;
    sign: string;
    degreesInSign: number;
}
export declare function toSign(siderealLongitude: number): SignPosition;
export interface NakshatraPosition {
    nakshatraNumber: number;
    nakshatra: string;
    pada: number;
    fractionTraversed: number;
}
export declare function toNakshatra(siderealLongitude: number): NakshatraPosition;
export declare function lordOfSign(signNumber: number): Graha;
export declare function houseOf(siderealLongitude: number, cuspLongitudes: readonly number[]): number;
