export interface PlanetaryPosition {
    name: string;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    isRetrograde: boolean;
    sign: string;
    signLord: string;
    nakshatra: string;
    nakshatraLord: string;
    nakshatraPada: number;
    house: number;
}
export interface HousePosition {
    houseNumber: number;
    cuspLongitude: number;
    sign: string;
    signLord: string;
    startDegree: number;
    endDegree: number;
}
export interface KundliData {
    lagna: {
        longitude: number;
        sign: string;
        signLord: string;
        degrees: number;
    };
    planets: PlanetaryPosition[];
    houses: HousePosition[];
    nakshatra: {
        name: string;
        lord: string;
        pada: number;
    };
    ayanamsa: number;
    tithi?: string;
    yoga?: string;
    karana?: string;
}
export declare class SwissEphemerisService {
    private readonly logger;
    private readonly signs;
    private readonly signLords;
    private readonly nakshatras;
    calculateKundli(params: {
        datetime: Date;
        latitude: number;
        longitude: number;
        timezone: string;
        ayanamsa?: number;
    }): Promise<KundliData>;
    private toJulianDay;
    private getTimezoneOffset;
    private toJulianDayFromLocal;
    private calculateAyanamsa;
    private calculateLagna;
    private calculatePlanets;
    private createPlanetPosition;
    private calculateHouses;
    private getSignFromLongitude;
    private getNakshatraFromLongitude;
    private calculateTithiFromPositions;
    private calculateYogaFromPositions;
    private calculateKaranaFromPositions;
    assignPlanetsToHouses(planets: PlanetaryPosition[], houses: HousePosition[]): PlanetaryPosition[];
}
