import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ZunoUser } from './zuno-user.entity';
export declare class ZunoUserProfile extends ZunoBaseEntity {
    user_id: string;
    preferred_name: string | null;
    display_name: string | null;
    country_code: string | null;
    city: string | null;
    occupation: string | null;
    preferred_language: string | null;
    user?: ZunoUser;
}
