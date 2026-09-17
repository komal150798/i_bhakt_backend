import { Injectable } from '@nestjs/common';
import { ZunoException } from '../errors/zuno.exception';

/**
 * Server-side ownership enforcement.
 *
 * Step 20 section 85 / Step 21 section 106: never fetch by id and return
 * without verifying ownership. Step 21 Golden Contract Test 125 is the
 * acceptance case - user A requesting user B's plan must leak nothing, not even
 * the fact that the id exists.
 *
 * That is why every failure path here produces NOT_FOUND rather than FORBIDDEN:
 * a 403 would confirm the resource exists, turning the endpoint into an
 * id-enumeration oracle.
 */
@Injectable()
export class ZunoOwnershipService {
  /**
   * Returns the entity when the caller owns it, otherwise throws NOT_FOUND.
   */
  require<T extends { user_id: string }>(
    entity: T | null | undefined,
    userId: string,
    entityLabel: string,
  ): T {
    if (!entity) {
      throw ZunoException.notFound(`${entityLabel} not found`);
    }
    if (entity.user_id !== userId) {
      throw ZunoException.notFound(
        `${entityLabel} ownership mismatch (masked as not found)`,
      );
    }
    return entity;
  }

  /**
   * Optimistic concurrency check. Step 21 section 108 / Golden Contract Test 130:
   * a client holding version 4 while the server is at version 5 because a
   * Realignment intervened must get 409, not silently overwrite.
   *
   * A client that sends no version is not forced into the check - some writes
   * are genuinely last-write-wins - but any write that could clobber
   * Realignment state passes an expected version.
   */
  assertVersion(
    entity: { version: number },
    expectedVersion: number | undefined,
  ): void {
    if (expectedVersion === undefined || expectedVersion === null) return;
    if (entity.version !== expectedVersion) {
      throw ZunoException.staleVersion(expectedVersion, entity.version);
    }
  }
}
