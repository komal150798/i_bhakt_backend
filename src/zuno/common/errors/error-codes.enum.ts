/**
 * ZUNO stable API error codes. Step 21 API Contracts section 13.
 *
 * These are machine codes, not user copy. Step 21 section 119 requires the two
 * to stay separate: the backend emits RULEBOOK_UNAVAILABLE, the client decides
 * how to phrase it. Adding a value here is a contract change.
 */
export enum ZunoErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  SAFETY_RESTRICTED = 'SAFETY_RESTRICTED',
  ENTITLEMENT_REQUIRED = 'ENTITLEMENT_REQUIRED',
  RULEBOOK_UNAVAILABLE = 'RULEBOOK_UNAVAILABLE',
  INTELLIGENCE_SERVICE_UNAVAILABLE = 'INTELLIGENCE_SERVICE_UNAVAILABLE',
  PROCESSING = 'PROCESSING',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/** Step 21 section 14: HTTP status guidance per error class. */
export const ZUNO_ERROR_HTTP_STATUS: Readonly<Record<ZunoErrorCode, number>> = {
  [ZunoErrorCode.VALIDATION_ERROR]: 400,
  [ZunoErrorCode.AUTHENTICATION_REQUIRED]: 401,
  [ZunoErrorCode.FORBIDDEN]: 403,
  [ZunoErrorCode.NOT_FOUND]: 404,
  [ZunoErrorCode.CONFLICT]: 409,
  [ZunoErrorCode.RATE_LIMITED]: 429,
  // 200 with a machine-readable safety disposition in the body is also valid per
  // section 14; a hard restriction that returns no content uses 403.
  [ZunoErrorCode.SAFETY_RESTRICTED]: 403,
  [ZunoErrorCode.ENTITLEMENT_REQUIRED]: 403,
  [ZunoErrorCode.RULEBOOK_UNAVAILABLE]: 503,
  [ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE]: 503,
  [ZunoErrorCode.PROCESSING]: 202,
  [ZunoErrorCode.INTERNAL_ERROR]: 500,
};

/**
 * Safe default messages.
 *
 * Step 21 section 12 and Build Rule 23 forbid leaking stack traces, database
 * errors, internal prompts or credentials. Every message here is written to be
 * safe to show verbatim if a client has no localised copy, and calm in tone
 * per Build Rule 117.
 */
export const ZUNO_ERROR_DEFAULT_MESSAGE: Readonly<Record<ZunoErrorCode, string>> = {
  [ZunoErrorCode.VALIDATION_ERROR]: 'Some information needs attention.',
  [ZunoErrorCode.AUTHENTICATION_REQUIRED]: 'Please sign in to continue.',
  [ZunoErrorCode.FORBIDDEN]: 'This is not available on your account.',
  [ZunoErrorCode.NOT_FOUND]: 'We could not find what you were looking for.',
  [ZunoErrorCode.CONFLICT]:
    'This has changed since you last loaded it. Please refresh and try again.',
  [ZunoErrorCode.RATE_LIMITED]: 'Please wait a moment before trying again.',
  [ZunoErrorCode.SAFETY_RESTRICTED]:
    'There is a limit to what we should advise here.',
  [ZunoErrorCode.ENTITLEMENT_REQUIRED]: 'This is part of a different plan.',
  [ZunoErrorCode.RULEBOOK_UNAVAILABLE]:
    'Your personalised guidance is temporarily unavailable. Everything you have already is still here.',
  [ZunoErrorCode.INTELLIGENCE_SERVICE_UNAVAILABLE]:
    'We could not work through this just now. Please try again shortly.',
  [ZunoErrorCode.PROCESSING]: 'We are still working on this.',
  [ZunoErrorCode.INTERNAL_ERROR]: 'Something went wrong on our side.',
};
