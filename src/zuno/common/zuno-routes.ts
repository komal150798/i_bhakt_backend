/**
 * Route roots owned by ZUNO, relative to the global `api/v1` prefix.
 *
 * Step 21 API Contracts section 6 fixes these paths (`/api/v1/me`,
 * `/api/v1/challenges`, ...). They are listed in one place because the legacy
 * global response interceptor and exception filter must hand ZUNO routes over
 * to ZUNO's own envelope rather than wrapping them in the iBhakt
 * `{success, code, message, data}` shape.
 *
 * Adding a ZUNO controller with a new root means adding it here, or its
 * responses will be double-wrapped and the contract will silently drift.
 */
export const ZUNO_ROUTE_ROOTS: readonly string[] = [
  'me',
  'challenges',
  'plans',
  'plan-items',
  'mka',
  'karma',
  'memory',
  'future-self',
  'conversations',
  'scenarios',
  'responses',
  'jobs',
  'locations',
  'internal',
  // Phase 9. Added when the Life Signal and Realignment engines arrived; the
  // rest of this list was reserved up front, these two were not.
  'signals',
  'realignment',
];

const ZUNO_PREFIXES = ZUNO_ROUTE_ROOTS.map((root) => `/api/v1/${root}`);

/**
 * True when a request URL belongs to the ZUNO contract surface.
 *
 * Matches an exact root or a root followed by `/` or `?` so that `/api/v1/me`
 * and `/api/v1/me/profile` match while a legacy route such as
 * `/api/v1/memberships` does not.
 */
export function isZunoRoute(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].replace(/\/+$/, '') || '/';
  return ZUNO_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
