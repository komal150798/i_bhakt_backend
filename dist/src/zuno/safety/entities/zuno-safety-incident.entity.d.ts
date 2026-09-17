import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { SafetyViolation, ZunoDomain, ZunoRiskClass } from '../../common/enums';
export declare class ZunoSafetyIncident extends ZunoImmutableEntity {
    user_id: string | null;
    safety_decision_id: string | null;
    related_response_id: string | null;
    source: string;
    domain: ZunoDomain | null;
    severity: ZunoRiskClass;
    violations: SafetyViolation[];
    status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
    policy_version: string;
    resolved_at: Date | null;
}
