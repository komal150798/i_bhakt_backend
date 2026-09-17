export interface AyanamsaAnchor {
    julianDay: number;
    degrees: number;
    source: string;
}
export declare function supportedAyanamsas(): string[];
export declare function findAnchor(system: string): AyanamsaAnchor | null;
export declare function precessionSinceJ2000(julianDay: number): number;
export declare function ayanamsaDegrees(system: string, julianDay: number): number;
export declare function toSidereal(tropicalLongitude: number, ayanamsa: number): number;
