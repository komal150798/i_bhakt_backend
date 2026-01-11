import { AntardashaRecord } from './antardasha-record.entity';
import { SukshmaDashaRecord } from './sukshma-dasha-record.entity';
export declare class PratyantarDashaRecord {
    id: number;
    antardasha_record_id: number;
    antardasha_record: AntardashaRecord;
    pratyantar_lord: string;
    start_date: Date;
    end_date: Date;
    duration_years: number;
    created_at: Date;
    sukshmadashas: SukshmaDashaRecord[];
}
