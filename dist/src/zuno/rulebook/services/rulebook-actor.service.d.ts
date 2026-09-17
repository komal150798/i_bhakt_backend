import { Repository } from 'typeorm';
import { AdminUser } from '../../../users/entities/admin-user.entity';
import { GovernanceActor } from './rulebook-governance.service';
import { RulebookPermission } from '../../common/enums';
export declare class RulebookActorService {
    private readonly admins;
    private readonly logger;
    constructor(admins: Repository<AdminUser>);
    resolve(principal: {
        id?: number | string;
        unique_id?: string;
        email?: string | null;
        type?: string;
    }): Promise<GovernanceActor>;
    private roleFor;
    private listFromEnv;
    static has(actor: GovernanceActor, permission: RulebookPermission): boolean;
}
