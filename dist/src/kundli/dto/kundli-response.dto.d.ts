export declare class MahadashaDto {
    lord: string;
    start: string;
    end: string;
    duration_years: number;
    duration_days: number;
    is_balance: boolean;
    is_shadow_planet?: boolean;
}
export declare class DetailedDashaPeriodDto {
    mahadasha: string;
    antardasha: string;
    pratyantar: string;
    start_date: string;
    end_date: string;
    duration_years: number;
    duration_days: number;
    is_shadow_planet?: boolean;
}
export declare class VimshottariDashaDto {
    birth_dasha_lord: string;
    balance_years: number;
    balance_days: number;
    mahadasha?: MahadashaDto[];
    current_mahadasha?: string;
    current_antardasha?: string;
    current_pratyantar?: string;
    detailed_timeline?: DetailedDashaPeriodDto[];
}
export declare class DashaTimelineDto {
    vimshottari?: VimshottariDashaDto;
}
export declare class PlanetPositionDto {
    name: string;
    longitude: number;
    latitude: number;
    sign: string;
    sign_lord: string;
    nakshatra: string;
    nakshatra_lord: string;
    nakshatra_pada: number;
    house: number;
    is_retrograde: boolean;
}
export declare class HouseDto {
    house_number: number;
    sign: string;
    sign_lord: string;
    start_degree: number;
    end_degree: number;
}
export declare class KundliResponseDto {
    name: string;
    birth_date: string;
    birth_time: string;
    birth_place: string;
    latitude: number;
    longitude: number;
    timezone: string;
    lagna: {
        sign: string;
        degrees: number;
        lord: string;
    };
    nakshatra: {
        name: string;
        pada: number;
        lord: string;
    };
    planets: PlanetPositionDto[];
    houses: HouseDto[];
    ayanamsa: number;
    tithi: string;
    yoga: string;
    karana: string;
    dasha_timeline?: DashaTimelineDto;
    full_data: Record<string, any>;
}
