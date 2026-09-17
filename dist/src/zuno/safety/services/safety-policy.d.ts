import { SafetyAction, SafetyBlockedCapability, SafetyDisposition, SafetyFlag, ZunoDomain, ZunoRiskClass } from '../../common/enums';
export interface SafetyRule {
    rule_id: string;
    domain: ZunoDomain | null;
    flag: SafetyFlag | null;
    risk_level: ZunoRiskClass;
    disposition: SafetyDisposition;
    required_actions: SafetyAction[];
    blocked_capabilities: SafetyBlockedCapability[];
    boundary_message?: string;
    suggested_support?: string;
    status: 'ACTIVE' | 'RETIRED';
    version: string;
}
export declare const ZUNO_SAFETY_RULES: readonly SafetyRule[];
export declare function activeRules(): SafetyRule[];
