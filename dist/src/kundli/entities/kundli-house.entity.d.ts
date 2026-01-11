import { BaseEntity } from '../../common/entities/base.entity';
import { Kundli } from './kundli.entity';
export declare class KundliHouse extends BaseEntity {
    kundli_id: number;
    house_number: number;
    cusp_degrees: number;
    sign_name: string;
    sign_number: number;
    metadata: Record<string, any> | null;
    kundli: Kundli;
}
