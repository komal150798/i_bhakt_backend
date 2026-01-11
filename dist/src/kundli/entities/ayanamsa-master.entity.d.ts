import { BaseEntity } from '../../common/entities/base.entity';
export declare class AyanamsaMaster extends BaseEntity {
    ayanamsa_name: string;
    display_name: string | null;
    default_value: number | null;
    description: string | null;
    is_default: boolean;
    metadata: Record<string, any> | null;
}
