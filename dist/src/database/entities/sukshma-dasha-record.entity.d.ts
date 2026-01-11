import { PratyantarDashaRecord } from './pratyantar-dasha-record.entity';
export declare class SukshmaDashaRecord {
    id: number;
    pratyantar_dasha_record_id: number;
    pratyantar_dasha_record: PratyantarDashaRecord;
    sukshma_lord: string;
    start_date: Date;
    end_date: Date;
    duration_years: number;
    created_at: Date;
}
