import { BaseEntity } from '../../common/entities/base.entity';
export declare class NakshatraMaster extends BaseEntity {
    nakshatra_name: string;
    nakshatra_number: number;
    start_degrees: number | null;
    end_degrees: number | null;
    ruler_planet: string | null;
    description: string | null;
    metadata: Record<string, any> | null;
}
