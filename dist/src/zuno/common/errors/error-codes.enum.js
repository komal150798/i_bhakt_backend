"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZUNO_ERROR_DEFAULT_MESSAGE = exports.ZUNO_ERROR_HTTP_STATUS = exports.ZunoErrorCode = void 0;
var ZunoErrorCode;
(function (ZunoErrorCode) {
    ZunoErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ZunoErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
    ZunoErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ZunoErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ZunoErrorCode["CONFLICT"] = "CONFLICT";
    ZunoErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    ZunoErrorCode["SAFETY_RESTRICTED"] = "SAFETY_RESTRICTED";
    ZunoErrorCode["ENTITLEMENT_REQUIRED"] = "ENTITLEMENT_REQUIRED";
    ZunoErrorCode["RULEBOOK_UNAVAILABLE"] = "RULEBOOK_UNAVAILABLE";
    ZunoErrorCode["INTELLIGENCE_SERVICE_UNAVAILABLE"] = "INTELLIGENCE_SERVICE_UNAVAILABLE";
    ZunoErrorCode["PROCESSING"] = "PROCESSING";
    ZunoErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ZunoErrorCode || (exports.ZunoErrorCode = ZunoErrorCode = {}));
exports.ZUNO_ERROR_HTTP_STATUS = {
    [ZunoErrorCode.VALIDATION_ERROR]: 400,
    [ZunoErrorCode.AUTHENTICATION_REQUIRED]: 401,
    [ZunoErrorCode.FORBIDDEN]: 403,
    [ZunoErrorCode.NOT_FOUND]: 404,
    [ZunoErrorCode.CONFLICT]: 409,
    [ZunoErrorCode.RATE_LIMITED]: 429,
    [ZunoErrorCode.SAFETY_RESTRICTED]: 403,
    [ZunoErrorCode.ENTITLEMENT_REQUIRED]: 403,
    [ZunoErrorCode.RULEBOOK_UNAVAILABLE]: 503,
    [ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE]: 503,
    [ZunoErrorCode.PROCESSING]: 202,
    [ZunoErrorCode.INTERNAL_ERROR]: 500,
};
exports.ZUNO_ERROR_DEFAULT_MESSAGE = {
    [ZunoErrorCode.VALIDATION_ERROR]: 'Some information needs attention.',
    [ZunoErrorCode.AUTHENTICATION_REQUIRED]: 'Please sign in to continue.',
    [ZunoErrorCode.FORBIDDEN]: 'This is not available on your account.',
    [ZunoErrorCode.NOT_FOUND]: 'We could not find what you were looking for.',
    [ZunoErrorCode.CONFLICT]: 'This has changed since you last loaded it. Please refresh and try again.',
    [ZunoErrorCode.RATE_LIMITED]: 'Please wait a moment before trying again.',
    [ZunoErrorCode.SAFETY_RESTRICTED]: 'There is a limit to what we should advise here.',
    [ZunoErrorCode.ENTITLEMENT_REQUIRED]: 'This is part of a different plan.',
    [ZunoErrorCode.RULEBOOK_UNAVAILABLE]: 'Your personalised guidance is temporarily unavailable. Everything you have already is still here.',
    [ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE]: 'We could not work through this just now. Please try again shortly.',
    [ZunoErrorCode.PROCESSING]: 'We are still working on this.',
    [ZunoErrorCode.INTERNAL_ERROR]: 'Something went wrong on our side.',
};
//# sourceMappingURL=error-codes.enum.js.map