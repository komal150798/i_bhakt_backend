"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceSource = exports.ConsentType = exports.BirthProfileSource = exports.BirthTimeAccuracy = exports.OnboardingStatus = exports.ZunoUserStatus = void 0;
var ZunoUserStatus;
(function (ZunoUserStatus) {
    ZunoUserStatus["ACTIVE"] = "ACTIVE";
    ZunoUserStatus["SUSPENDED"] = "SUSPENDED";
    ZunoUserStatus["PENDING_DELETION"] = "PENDING_DELETION";
    ZunoUserStatus["DELETED"] = "DELETED";
})(ZunoUserStatus || (exports.ZunoUserStatus = ZunoUserStatus = {}));
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["NOT_STARTED"] = "NOT_STARTED";
    OnboardingStatus["PROFILE_MINIMAL"] = "PROFILE_MINIMAL";
    OnboardingStatus["BIRTH_PENDING"] = "BIRTH_PENDING";
    OnboardingStatus["COMPLETED"] = "COMPLETED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
var BirthTimeAccuracy;
(function (BirthTimeAccuracy) {
    BirthTimeAccuracy["EXACT"] = "EXACT";
    BirthTimeAccuracy["APPROXIMATE"] = "APPROXIMATE";
    BirthTimeAccuracy["UNKNOWN"] = "UNKNOWN";
    BirthTimeAccuracy["RECTIFIED"] = "RECTIFIED";
})(BirthTimeAccuracy || (exports.BirthTimeAccuracy = BirthTimeAccuracy = {}));
var BirthProfileSource;
(function (BirthProfileSource) {
    BirthProfileSource["USER_PROVIDED"] = "USER_PROVIDED";
    BirthProfileSource["USER_CONFIRMED"] = "USER_CONFIRMED";
    BirthProfileSource["IMPORTED"] = "IMPORTED";
    BirthProfileSource["ADMIN_ENTERED"] = "ADMIN_ENTERED";
})(BirthProfileSource || (exports.BirthProfileSource = BirthProfileSource = {}));
var ConsentType;
(function (ConsentType) {
    ConsentType["TERMS_OF_SERVICE"] = "TERMS_OF_SERVICE";
    ConsentType["PRIVACY_POLICY"] = "PRIVACY_POLICY";
    ConsentType["BIRTH_DATA_PROCESSING"] = "BIRTH_DATA_PROCESSING";
    ConsentType["PERSONALISATION"] = "PERSONALISATION";
    ConsentType["NOTIFICATIONS"] = "NOTIFICATIONS";
    ConsentType["ANALYTICS"] = "ANALYTICS";
})(ConsentType || (exports.ConsentType = ConsentType = {}));
var PreferenceSource;
(function (PreferenceSource) {
    PreferenceSource["USER_EXPLICIT"] = "USER_EXPLICIT";
    PreferenceSource["SYSTEM_DEFAULT"] = "SYSTEM_DEFAULT";
    PreferenceSource["INFERRED"] = "INFERRED";
})(PreferenceSource || (exports.PreferenceSource = PreferenceSource = {}));
//# sourceMappingURL=identity.enum.js.map