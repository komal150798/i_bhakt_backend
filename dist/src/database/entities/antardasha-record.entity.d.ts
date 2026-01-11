import { DashaRecord } from './dasha-record.entity';
import { PratyantarDashaRecord } from './pratyantar-dasha-record.entity';
export declare class AntardashaRecord {
    id: number;
    dasha_record_id: number;
    dasha_record: DashaRecord;
    antardasha_lord: string;
    start_date: Date;
    end_date: Date;
    duration_years: number;
    created_at: Date;
    pratyantardashas: PratyantarDashaRecord[];
}
