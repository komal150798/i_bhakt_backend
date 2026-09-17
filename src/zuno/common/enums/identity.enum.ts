/** Step 20 Data Model section 10: users.status. */
export enum ZunoUserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_DELETION = 'PENDING_DELETION',
  DELETED = 'DELETED',
}

/**
 * Step 20 section 10 / Step 30 Phase 2 section 18: onboarding is progressive.
 * A user must be able to get value before the profile is complete.
 */
export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  PROFILE_MINIMAL = 'PROFILE_MINIMAL',
  BIRTH_PENDING = 'BIRTH_PENDING',
  COMPLETED = 'COMPLETED',
}

/**
 * Step 20 Data Model section 15: birth time accuracy.
 *
 * Build Rule 53 is strict here - an approximate birth time must never be
 * silently promoted to EXACT, because downstream astrology precision depends
 * on it. UNKNOWN is a legitimate, preserved state, never a value to guess.
 */
export enum BirthTimeAccuracy {
  EXACT = 'EXACT',
  APPROXIMATE = 'APPROXIMATE',
  UNKNOWN = 'UNKNOWN',
  RECTIFIED = 'RECTIFIED',
}

/** Where birth data came from, for provenance. */
export enum BirthProfileSource {
  USER_PROVIDED = 'USER_PROVIDED',
  USER_CONFIRMED = 'USER_CONFIRMED',
  IMPORTED = 'IMPORTED',
  ADMIN_ENTERED = 'ADMIN_ENTERED',
}

/** Step 20 section 13: consent records. */
export enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  BIRTH_DATA_PROCESSING = 'BIRTH_DATA_PROCESSING',
  PERSONALISATION = 'PERSONALISATION',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ANALYTICS = 'ANALYTICS',
}

/** Step 20 section 12: where a preference came from. */
export enum PreferenceSource {
  USER_EXPLICIT = 'USER_EXPLICIT',
  SYSTEM_DEFAULT = 'SYSTEM_DEFAULT',
  INFERRED = 'INFERRED',
}
