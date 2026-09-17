import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { ConsentType } from '../../common/enums';
export declare class ZunoUserConsent extends ZunoBaseEntity {
    user_id: string;
    consent_type: ConsentType;
    policy_version: string;
    granted: boolean;
    granted_at: Date | null;
    revoked_at: Date | null;
    metadata: Record<string, unknown> | null;
}
