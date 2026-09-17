import { ZunoOwnershipService } from './zuno-ownership.service';
import { ZunoException } from '../errors/zuno.exception';
import { ZunoErrorCode } from '../errors/error-codes.enum';

/**
 * Authorization tests are a release gate, not backlog (Build Rule 99).
 * Step 21 Golden Contract Tests 125 and 130.
 */
describe('ZunoOwnershipService', () => {
  const service = new ZunoOwnershipService();

  describe('require', () => {
    it('returns the entity to its owner', () => {
      const entity = { user_id: 'user-a', id: 'x' };
      expect(service.require(entity, 'user-a', 'challenge')).toBe(entity);
    });

    it('refuses another user\'s entity', () => {
      const entity = { user_id: 'user-b', id: 'x' };
      expect(() => service.require(entity, 'user-a', 'challenge')).toThrow(
        ZunoException,
      );
    });

    it('reports NOT_FOUND, never FORBIDDEN, for another user\'s entity', () => {
      // Step 21 Golden Contract Test 125: no data leakage. A 403 would confirm
      // the id exists and turn the endpoint into an enumeration oracle, so both
      // "does not exist" and "not yours" must be indistinguishable.
      const entity = { user_id: 'user-b', id: 'x' };
      try {
        service.require(entity, 'user-a', 'challenge');
        fail('expected a throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoException);
        expect((error as ZunoException).code).toBe(ZunoErrorCode.NOT_FOUND);
        expect((error as ZunoException).getStatus()).toBe(404);
      }
    });

    it('produces the identical error for a missing row and a foreign row', () => {
      const missing = captureError(() =>
        service.require(null, 'user-a', 'challenge'),
      );
      const foreign = captureError(() =>
        service.require({ user_id: 'user-b' }, 'user-a', 'challenge'),
      );

      // The client-visible bodies must be byte-identical.
      expect(missing.getStatus()).toBe(foreign.getStatus());
      expect(missing.getResponse()).toEqual(foreign.getResponse());
    });

    it('refuses undefined', () => {
      expect(() => service.require(undefined, 'user-a', 'plan')).toThrow(
        ZunoException,
      );
    });
  });

  describe('assertVersion', () => {
    it('passes when the version matches', () => {
      expect(() => service.assertVersion({ version: 4 }, 4)).not.toThrow();
    });

    it('raises 409 on a stale version', () => {
      // Step 21 Golden Contract Test 130: the client holds v4, a Realignment
      // moved the server to v5, so the write must be refused rather than
      // silently clobbering newer state.
      const error = captureError(() => service.assertVersion({ version: 5 }, 4));
      expect(error.code).toBe(ZunoErrorCode.CONFLICT);
      expect(error.getStatus()).toBe(409);
    });

    it('skips the check when the client sent no version', () => {
      // Not every write is concurrency-sensitive; Step 21 section 108 makes the
      // version optional, and omitting it must not become an implicit v0.
      expect(() => service.assertVersion({ version: 9 }, undefined)).not.toThrow();
    });
  });
});

function captureError(fn: () => unknown): ZunoException {
  try {
    fn();
  } catch (error) {
    return error as ZunoException;
  }
  throw new Error('expected a throw');
}
