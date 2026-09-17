"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zuno_ownership_service_1 = require("./zuno-ownership.service");
const zuno_exception_1 = require("../errors/zuno.exception");
const error_codes_enum_1 = require("../errors/error-codes.enum");
describe('ZunoOwnershipService', () => {
    const service = new zuno_ownership_service_1.ZunoOwnershipService();
    describe('require', () => {
        it('returns the entity to its owner', () => {
            const entity = { user_id: 'user-a', id: 'x' };
            expect(service.require(entity, 'user-a', 'challenge')).toBe(entity);
        });
        it('refuses another user\'s entity', () => {
            const entity = { user_id: 'user-b', id: 'x' };
            expect(() => service.require(entity, 'user-a', 'challenge')).toThrow(zuno_exception_1.ZunoException);
        });
        it('reports NOT_FOUND, never FORBIDDEN, for another user\'s entity', () => {
            const entity = { user_id: 'user-b', id: 'x' };
            try {
                service.require(entity, 'user-a', 'challenge');
                fail('expected a throw');
            }
            catch (error) {
                expect(error).toBeInstanceOf(zuno_exception_1.ZunoException);
                expect(error.code).toBe(error_codes_enum_1.ZunoErrorCode.NOT_FOUND);
                expect(error.getStatus()).toBe(404);
            }
        });
        it('produces the identical error for a missing row and a foreign row', () => {
            const missing = captureError(() => service.require(null, 'user-a', 'challenge'));
            const foreign = captureError(() => service.require({ user_id: 'user-b' }, 'user-a', 'challenge'));
            expect(missing.getStatus()).toBe(foreign.getStatus());
            expect(missing.getResponse()).toEqual(foreign.getResponse());
        });
        it('refuses undefined', () => {
            expect(() => service.require(undefined, 'user-a', 'plan')).toThrow(zuno_exception_1.ZunoException);
        });
    });
    describe('assertVersion', () => {
        it('passes when the version matches', () => {
            expect(() => service.assertVersion({ version: 4 }, 4)).not.toThrow();
        });
        it('raises 409 on a stale version', () => {
            const error = captureError(() => service.assertVersion({ version: 5 }, 4));
            expect(error.code).toBe(error_codes_enum_1.ZunoErrorCode.CONFLICT);
            expect(error.getStatus()).toBe(409);
        });
        it('skips the check when the client sent no version', () => {
            expect(() => service.assertVersion({ version: 9 }, undefined)).not.toThrow();
        });
    });
});
function captureError(fn) {
    try {
        fn();
    }
    catch (error) {
        return error;
    }
    throw new Error('expected a throw');
}
//# sourceMappingURL=zuno-ownership.service.spec.js.map