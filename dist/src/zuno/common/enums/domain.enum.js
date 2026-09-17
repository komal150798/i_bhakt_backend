"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMAIN_BASELINE_RISK = exports.ZunoRiskClass = exports.ZUNO_DOMAINS = exports.ZunoDomain = void 0;
exports.isZunoDomain = isZunoDomain;
var ZunoDomain;
(function (ZunoDomain) {
    ZunoDomain["CAREER"] = "CAREER";
    ZunoDomain["FINANCE"] = "FINANCE";
    ZunoDomain["BUSINESS"] = "BUSINESS";
    ZunoDomain["EDUCATION"] = "EDUCATION";
    ZunoDomain["RELATIONSHIP"] = "RELATIONSHIP";
    ZunoDomain["MARRIAGE"] = "MARRIAGE";
    ZunoDomain["FAMILY"] = "FAMILY";
    ZunoDomain["HEALTH_WELLBEING"] = "HEALTH_WELLBEING";
    ZunoDomain["PROPERTY"] = "PROPERTY";
    ZunoDomain["LEGAL"] = "LEGAL";
    ZunoDomain["TRAVEL"] = "TRAVEL";
    ZunoDomain["FOREIGN_RESIDENCE"] = "FOREIGN_RESIDENCE";
    ZunoDomain["PERSONAL_GROWTH"] = "PERSONAL_GROWTH";
    ZunoDomain["GENERAL"] = "GENERAL";
})(ZunoDomain || (exports.ZunoDomain = ZunoDomain = {}));
exports.ZUNO_DOMAINS = Object.values(ZunoDomain);
function isZunoDomain(value) {
    return typeof value === 'string' && exports.ZUNO_DOMAINS.includes(value);
}
var ZunoRiskClass;
(function (ZunoRiskClass) {
    ZunoRiskClass["LOW_RISK"] = "LOW_RISK";
    ZunoRiskClass["MODERATE_RISK"] = "MODERATE_RISK";
    ZunoRiskClass["HIGH_STAKES"] = "HIGH_STAKES";
    ZunoRiskClass["CRITICAL_SAFETY"] = "CRITICAL_SAFETY";
})(ZunoRiskClass || (exports.ZunoRiskClass = ZunoRiskClass = {}));
exports.DOMAIN_BASELINE_RISK = {
    [ZunoDomain.CAREER]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.FINANCE]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.BUSINESS]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.EDUCATION]: ZunoRiskClass.LOW_RISK,
    [ZunoDomain.RELATIONSHIP]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.MARRIAGE]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.FAMILY]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.HEALTH_WELLBEING]: ZunoRiskClass.HIGH_STAKES,
    [ZunoDomain.PROPERTY]: ZunoRiskClass.MODERATE_RISK,
    [ZunoDomain.LEGAL]: ZunoRiskClass.HIGH_STAKES,
    [ZunoDomain.TRAVEL]: ZunoRiskClass.LOW_RISK,
    [ZunoDomain.FOREIGN_RESIDENCE]: ZunoRiskClass.HIGH_STAKES,
    [ZunoDomain.PERSONAL_GROWTH]: ZunoRiskClass.LOW_RISK,
    [ZunoDomain.GENERAL]: ZunoRiskClass.LOW_RISK,
};
//# sourceMappingURL=domain.enum.js.map