import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoUserProfile } from '../entities/zuno-user-profile.entity';
import { ZunoBirthProfile } from '../entities/zuno-birth-profile.entity';
import { UpdateProfileDto, UpsertBirthProfileDto } from '../dtos/identity.dtos';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
export declare class ZunoProfileService {
    private readonly users;
    private readonly profiles;
    private readonly birthProfiles;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly dataSource;
    constructor(users: Repository<ZunoUser>, profiles: Repository<ZunoUserProfile>, birthProfiles: Repository<ZunoBirthProfile>, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, dataSource: DataSource);
    getProfile(userId: string): Promise<ZunoUserProfile | null>;
    updateProfile(user: ZunoUser, dto: UpdateProfileDto): Promise<{
        profile: ZunoUserProfile;
        user: ZunoUser;
    }>;
    getBirthProfile(userId: string): Promise<ZunoBirthProfile | null>;
    upsertBirthProfile(user: ZunoUser, dto: UpsertBirthProfileDto): Promise<ZunoBirthProfile>;
    private refreshOnboarding;
}
