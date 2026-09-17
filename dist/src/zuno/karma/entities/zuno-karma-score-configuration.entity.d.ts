import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { KarmaRescorePolicy, KarmaScoreConfigStatus } from '../enums/karma.enum';
export declare class ZunoKarmaScoreConfiguration extends ZunoBaseEntity {
    version: string;
    configuration: Record<string, unknown>;
    status: KarmaScoreConfigStatus;
    rescore_policy: KarmaRescorePolicy;
    effective_from: Date;
    effective_to: Date | null;
}
