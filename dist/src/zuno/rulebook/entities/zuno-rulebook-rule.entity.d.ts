import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { RuleConditionOperator, RuleConditionType, RuleFactorRole, RuleSafetyClass, RuleStatus, RuleTheme, SmeConfidence, ThemeDirection, ThemeStrength, ZunoDomain } from '../../common/enums';
import { ZunoRulebookVersion } from './zuno-rulebook-version.entity';
export interface RuleCondition {
    type: RuleConditionType;
    role: RuleFactorRole;
    operator?: RuleConditionOperator;
    planet?: string;
    house?: number;
    sign?: string;
    nakshatra?: string;
    aspect_to?: string;
    divisional_chart?: string;
    parameters?: Record<string, unknown>;
    raw_expression: string;
}
export declare class ZunoRulebookRule extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_rule_key: string;
    rule_name: string;
    domain: ZunoDomain;
    subcategory: string | null;
    conditions: RuleCondition[];
    theme: RuleTheme;
    direction: ThemeDirection;
    strength: ThemeStrength;
    interpretation_key: string | null;
    timing_rule_keys: string[];
    remedy_keys: string[];
    conflict_rule_keys: string[];
    status: RuleStatus;
    safety_class: RuleSafetyClass;
    sensitive_subjects: string[];
    sme_confidence: SmeConfidence;
    sme_comment: string | null;
    effective_from: string | null;
    effective_until: string | null;
    rule_version: string;
    change_reason: string | null;
    source_row: number | null;
    rulebook_version?: ZunoRulebookVersion;
    isProductionEligible(): boolean;
}
