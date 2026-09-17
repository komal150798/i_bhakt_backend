import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { OnboardingStatus, ZunoUserStatus } from '../../common/enums';
import { ZunoUserProfile } from './zuno-user-profile.entity';
import { ZunoBirthProfile } from './zuno-birth-profile.entity';
export declare class ZunoUser extends ZunoBaseEntity {
    auth_subject: string;
    customer_id: string | null;
    status: ZunoUserStatus;
    timezone: string | null;
    locale: string | null;
    onboarding_status: OnboardingStatus;
    profile?: ZunoUserProfile;
    birth_profiles?: ZunoBirthProfile[];
}
