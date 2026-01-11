import { KarmaRecord } from './karma-record.entity';
export declare class KarmaCategory {
    id: number;
    slug: string;
    label: string;
    description: string;
    polarity: string;
    default_weight: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    karma_records: KarmaRecord[];
}
