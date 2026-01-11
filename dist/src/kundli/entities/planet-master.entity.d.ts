import { BaseEntity } from '../../common/entities/base.entity';
export declare class PlanetMaster extends BaseEntity {
    planet_name: string;
    symbol: string | null;
    description: string | null;
    metadata: Record<string, any> | null;
}
