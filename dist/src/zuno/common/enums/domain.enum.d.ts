export declare enum ZunoDomain {
    CAREER = "CAREER",
    FINANCE = "FINANCE",
    BUSINESS = "BUSINESS",
    EDUCATION = "EDUCATION",
    RELATIONSHIP = "RELATIONSHIP",
    MARRIAGE = "MARRIAGE",
    FAMILY = "FAMILY",
    HEALTH_WELLBEING = "HEALTH_WELLBEING",
    PROPERTY = "PROPERTY",
    LEGAL = "LEGAL",
    TRAVEL = "TRAVEL",
    FOREIGN_RESIDENCE = "FOREIGN_RESIDENCE",
    PERSONAL_GROWTH = "PERSONAL_GROWTH",
    GENERAL = "GENERAL"
}
export declare const ZUNO_DOMAINS: readonly ZunoDomain[];
export declare function isZunoDomain(value: unknown): value is ZunoDomain;
export declare enum ZunoRiskClass {
    LOW_RISK = "LOW_RISK",
    MODERATE_RISK = "MODERATE_RISK",
    HIGH_STAKES = "HIGH_STAKES",
    CRITICAL_SAFETY = "CRITICAL_SAFETY"
}
export declare const DOMAIN_BASELINE_RISK: Readonly<Record<ZunoDomain, ZunoRiskClass>>;
