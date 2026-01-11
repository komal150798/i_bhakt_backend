import { BaseEntity } from '../../common/entities/base.entity';
import { Kundli } from './kundli.entity';
export declare class KundliPlanet extends BaseEntity {
    kundli_id: number;
    planet_name: string;
    longitude_degrees: number;
    sign_number: number;
    sign_name: string;
    house_number: number;
    nakshatra: string | null;
    pada: number | null;
    is_retrograde: boolean;
    speed: number | null;
    metadata: Record<string, any> | null;
    kundli: Kundli;
}
