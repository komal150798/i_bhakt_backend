import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { PreferenceSource } from '../../common/enums';
export declare class ZunoUserPreference extends ZunoBaseEntity {
    user_id: string;
    preference_key: string;
    preference_value: unknown;
    source: PreferenceSource;
    is_active: boolean;
}
