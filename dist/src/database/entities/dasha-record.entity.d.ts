import { User } from '../../users/entities/user.entity';
import { AntardashaRecord } from './antardasha-record.entity';
export declare class DashaRecord {
    id: number;
    user_id: number;
    user: User;
    mahadasha_lord: string;
    start_date: Date;
    end_date: Date;
    duration_years: number;
    created_at: Date;
    antardashas: AntardashaRecord[];
}
