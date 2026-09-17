import { ZunoImmutableEntity } from '../../common/entities/zuno-base.entity';
import { SafetyAction, SafetyBlockedCapability, SafetyDisposition, SafetyFlag, ZunoDomain, ZunoRiskClass } from '../../common/enums';
export declare class ZunoSafetyDecision extends ZunoImmutableEntity {
    user_id: string;
    challenge_id: string | null;
    operation: string;
    risk_level: ZunoRiskClass;
    disposition: SafetyDisposition;
    domains: ZunoDomain[];
    flags: SafetyFlag[];
    actions: SafetyAction[];
    blocked_capabilities: SafetyBlockedCapability[];
    matched_rule_ids: string[];
    policy_version: string;
}
