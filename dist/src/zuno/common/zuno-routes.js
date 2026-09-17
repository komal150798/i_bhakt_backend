"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZUNO_ROUTE_ROOTS = void 0;
exports.isZunoRoute = isZunoRoute;
exports.ZUNO_ROUTE_ROOTS = [
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
    'signals',
    'realignment',
];
const ZUNO_PREFIXES = exports.ZUNO_ROUTE_ROOTS.map((root) => `/api/v1/${root}`);
function isZunoRoute(url) {
    if (!url)
        return false;
    const path = url.split('?')[0].replace(/\/+$/, '') || '/';
    return ZUNO_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
//# sourceMappingURL=zuno-routes.js.map