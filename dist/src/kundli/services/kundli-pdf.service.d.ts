export interface DetailedDashaPeriod {
    mahadasha: string;
    antardasha: string;
    pratyantar: string;
    start_date: string;
    end_date: string;
    duration_years: number;
}
export interface KundliPdfData {
    name: string;
    birth_date: string;
    birth_time: string;
    birth_place: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    lagna?: {
        sign: string;
        degrees: number;
        lord: string;
    };
    nakshatra?: {
        name: string;
        pada: number;
        lord: string;
    };
    planets?: Array<{
        name: string;
        sign: string;
        sign_lord?: string;
        house?: number;
        nakshatra?: string;
        nakshatra_pada?: number;
        is_retrograde?: boolean;
        longitude?: number;
    }>;
    houses?: Array<{
        house_number: number;
        sign: string;
        sign_lord?: string;
        start_degree?: number;
        end_degree?: number;
    }>;
    ayanamsa?: number;
    tithi?: string;
    yoga?: string;
    karana?: string;
    dasha_timeline?: {
        vimshottari?: {
            mahadasha?: Array<{
                lord: string;
                start: string;
                end: string;
                duration_years: number;
            }>;
            current_mahadasha?: string;
            current_antardasha?: string;
            current_pratyantar?: string;
            detailed_timeline?: DetailedDashaPeriod[];
        };
    };
}
export declare class KundliPdfService {
    private readonly logger;
    generatePdf(data: KundliPdfData): Promise<Buffer>;
    private addHeader;
    private addBasicDetails;
    private addLagnaNakshatra;
    private addPanchang;
    private addDashaSection;
    private addDetailedDashaTable;
    private addDashaPageBreak;
    private renderDashaPeriodRow;
    private getDashaRowBgColor;
    private drawDashaTableHeader;
    private getMahadashaIndex;
    private formatDuration;
    private addPlanetaryPositions;
    private addHousesSection;
    private addFooter;
    private addSectionTitle;
    private addLabelValue;
    private drawInfoBox;
    private drawTableHeader;
    private formatDate;
}
