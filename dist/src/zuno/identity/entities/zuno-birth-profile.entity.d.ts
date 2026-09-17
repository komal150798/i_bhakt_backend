import { ZunoVersionedEntity } from '../../common/entities/zuno-base.entity';
import { BirthProfileSource, BirthTimeAccuracy } from '../../common/enums';
import { ZunoUser } from './zuno-user.entity';
export declare class ZunoBirthProfile extends ZunoVersionedEntity {
    user_id: string;
    date_of_birth: string;
    time_of_birth: string | null;
    time_accuracy: BirthTimeAccuracy;
    place_name: string;
    place_country_code: string | null;
    latitude: string | null;
    longitude: string | null;
    timezone_at_birth: string | null;
    source: BirthProfileSource;
    user?: ZunoUser;
    get isCalculationReady(): boolean;
}
