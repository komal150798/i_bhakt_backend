import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoProfileService } from '../services/zuno-profile.service';
import { BirthProfileView, MeView, ProfileView, UpdateProfileDto, UpsertBirthProfileDto } from '../dtos/identity.dtos';
export declare class ZunoMeController {
    private readonly profiles;
    constructor(profiles: ZunoProfileService);
    me(user: ZunoUser): Promise<MeView>;
    getProfile(user: ZunoUser): Promise<ProfileView>;
    updateProfile(user: ZunoUser, dto: UpdateProfileDto): Promise<ProfileView>;
    getBirthProfile(user: ZunoUser): Promise<BirthProfileView>;
    putBirthProfile(user: ZunoUser, dto: UpsertBirthProfileDto): Promise<BirthProfileView>;
}
