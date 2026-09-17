import { ZunoBaseEntity } from '../../common/entities/zuno-base.entity';
import { MkaDimension, RemedyFrequency, RemedyType, RuleSafetyClass, RuleStatus, RuleTheme, ThemeStrength, TimingWindowType, ZunoDomain } from '../../common/enums';
export declare class ZunoRulebookInterpretation extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_interpretation_key: string;
    theme: RuleTheme | null;
    meaning: string;
    allowed_domains: ZunoDomain[];
    user_safe_summary: string | null;
    status: RuleStatus;
    source_row: number | null;
}
export declare class ZunoRulebookTimingRule extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_timing_key: string;
    domain: ZunoDomain | null;
    window_type: TimingWindowType;
    strength: ThemeStrength;
    conditions: Record<string, unknown>[];
    timing_language: string | null;
    status: RuleStatus;
    source_row: number | null;
}
export declare class ZunoRulebookRemedy extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_remedy_key: string;
    name: string;
    remedy_type: RemedyType;
    mka_dimension: MkaDimension;
    purpose: string;
    astrological_basis: string | null;
    instructions: string;
    frequency: RemedyFrequency;
    duration: string | null;
    preferred_time: string | null;
    restrictions: string | null;
    conflicts_with: string[];
    safety_class: RuleSafetyClass;
    has_financial_cost: boolean;
    is_devotional: boolean;
    alternative_keys: string[];
    user_explanation: string | null;
    status: RuleStatus;
    source_row: number | null;
}
export declare class ZunoRulebookDomainConfig extends ZunoBaseEntity {
    rulebook_version_id: string;
    domain: ZunoDomain;
    primary_houses: number[];
    secondary_houses: number[];
    primary_planets: string[];
    supporting_planets: string[];
    relevant_divisional_charts: string[];
    timing_factors: string[];
    methodology_notes: string | null;
    source_row: number | null;
}
export declare class ZunoRulebookConflictRule extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_conflict_key: string;
    rule_keys: string[];
    resolution_strategy: string;
    winning_rule_key: string | null;
    rationale: string | null;
    source_row: number | null;
}
export declare class ZunoRulebookGoldenCase extends ZunoBaseEntity {
    rulebook_version_id: string;
    external_case_key: string;
    case_name: string;
    domain: ZunoDomain | null;
    birth_data: Record<string, unknown>;
    challenge_statement: string;
    expected_rule_keys: string[];
    expected_themes: string[];
    expected_outcome_notes: string | null;
    source_row: number | null;
}
