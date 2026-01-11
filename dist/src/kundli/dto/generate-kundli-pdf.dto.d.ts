declare class LagnaDto {
    sign: string;
    degrees: number;
    lord: string;
}
declare class NakshatraDto {
    name: string;
    pada: number;
    lord: string;
}
declare class PlanetDto {
    name: string;
    sign: string;
    sign_lord?: string;
    house?: number;
    nakshatra?: string;
    nakshatra_lord?: string;
    nakshatra_pada?: number;
    is_retrograde?: boolean;
    longitude?: number;
    latitude?: number;
}
declare class HouseDto {
    house_number: number;
    sign: string;
    sign_lord?: string;
    start_degree?: number;
    end_degree?: number;
}
declare class MahadashaDto {
    lord: string;
    start: string;
    end: string;
    duration_years: number;
}
declare class DetailedTimelineEntryDto {
    mahadasha: string;
    antardasha: string;
    pratyantar: string;
    start_date: string;
    end_date: string;
    duration_years: number;
}
declare class VimshottariDashaDto {
    mahadasha?: MahadashaDto[];
    current_mahadasha?: string;
    current_antardasha?: string;
    current_pratyantar?: string;
    detailed_timeline?: DetailedTimelineEntryDto[];
}
declare class DashaTimelineDto {
    vimshottari?: VimshottariDashaDto;
}
export declare class GenerateKundliPdfDto {
    name: string;
    birth_date: string;
    birth_time: string;
    birth_place: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    lagna?: LagnaDto;
    nakshatra?: NakshatraDto;
    planets?: PlanetDto[];
    houses?: HouseDto[];
    ayanamsa?: number;
    tithi?: string;
    yoga?: string;
    karana?: string;
    dasha_timeline?: DashaTimelineDto;
    full_data?: Record<string, any>;
}
export {};
