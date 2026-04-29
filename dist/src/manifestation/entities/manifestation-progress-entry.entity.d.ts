import { BaseEntity } from '../../common/entities/base.entity';
import { Manifestation } from './manifestation.entity';
export declare class ManifestationProgressEntry extends BaseEntity {
    manifestation_id: number;
    user_id: number;
    entry_date: Date;
    action_text: string;
    manifestation: Manifestation;
}
