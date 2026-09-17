import { BirthTimeAccuracy, OnboardingStatus } from '../../common/enums';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoUserProfile } from '../entities/zuno-user-profile.entity';
import { ZunoBirthProfile } from '../entities/zuno-birth-profile.entity';
export declare class MeView {
    id: string;
    preferredName: string | null;
    locale: string | null;
    timezone: string | null;
    onboardingStatus: OnboardingStatus;
    static from(user: ZunoUser, profile: ZunoUserProfile | null): MeView;
}
export declare class UpdateProfileDto {
    preferredName?: string;
    displayName?: string;
    countryCode?: string;
    city?: string;
    occupation?: string;
    preferredLanguage?: string;
    timezone?: string;
}
export declare class ProfileView {
    preferredName: string | null;
    displayName: string | null;
    countryCode: string | null;
    city: string | null;
    occupation: string | null;
    preferredLanguage: string | null;
    timezone: string | null;
    static from(profile: ZunoUserProfile | null, user: ZunoUser): ProfileView;
}
export declare class UpsertBirthProfileDto {
    dateOfBirth: string;
    timeOfBirth?: string;
    timeAccuracy: BirthTimeAccuracy;
    placeName: string;
    placeCountryCode?: string;
}
export declare class BirthProfileView {
    id: string;
    dateOfBirth: string;
    timeOfBirth: string | null;
    timeAccuracy: BirthTimeAccuracy;
    placeName: string;
    placeCountryCode: string | null;
    placeResolved: boolean;
    calculationReady: boolean;
    version: number;
    static from(profile: ZunoBirthProfile): BirthProfileView;
}
