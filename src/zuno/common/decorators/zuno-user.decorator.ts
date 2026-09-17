import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { ZUNO_USER_REQUEST_KEY } from '../guards/zuno-user.guard';
import { ZunoException } from '../errors/zuno.exception';

/**
 * Injects the resolved ZUNO user.
 *
 * Controllers take the user from here and never from a route parameter or
 * request body. Step 20 Anti-Pattern 140 and Step 21 Rule 6: a client-supplied
 * user id is never proof of ownership.
 *
 * Throws rather than returning undefined if ZunoUserGuard did not run, so a
 * missing guard fails loudly at the first request instead of silently
 * producing `user_id: undefined` queries that match nothing - or worse,
 * everything.
 */
export const CurrentZunoUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ZunoUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request[ZUNO_USER_REQUEST_KEY];
    if (!user) {
      throw ZunoException.internal(
        'CurrentZunoUser used without ZunoUserGuard on the route',
      );
    }
    return user;
  },
);
