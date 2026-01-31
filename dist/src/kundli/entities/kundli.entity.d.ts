import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
import { KundliPlanet } from './kundli-planet.entity';
import { KundliHouse } from './kundli-house.entity';
export declare class Kundli extends BaseEntity {
    user_id: number;
    birth_date: Date;
    birth_time: string;
    birth_place: string;
    latitude: number;
    longitude: number;
    timezone: string;
    lagna_degrees: number | null;
    lagna_name: string | null;
    nakshatra: string | null;
    pada: number | null;
    tithi: string | null;
    yoga: string | null;
    karana: string | null;
    ayanamsa: number | null;
    full_data: Record<string, any> | null;
    dasha_timeline: Record<string, any>[] | null;
    navamsa_data: Record<string, any> | null;
    customer: Customer;
    planets: KundliPlanet[];
    houses: KundliHouse[];
}
