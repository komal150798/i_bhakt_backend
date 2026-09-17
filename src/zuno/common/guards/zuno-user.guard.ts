import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ZunoUserResolverService } from '../../identity/services/zuno-user-resolver.service';
import { ZunoException } from '../errors/zuno.exception';
import { ZunoErrorCode } from '../errors/error-codes.enum';
import { RequestContextService } from '../services/request-context.service';

/** Key under which the resolved ZUNO user is stashed on the request. */
export const ZUNO_USER_REQUEST_KEY = 'zunoUser';

/**
 * Resolves the authenticated principal into a ZUNO user and attaches it to the
 * request, so no controller has to do it and none can forget to.
 *
 * Runs after JwtAuthGuard, which populates `request.user`. Step 30 Phase 1
 * section 12 calls for reusable `requireAuthenticatedUser` /
 * `requireResourceOwner` patterns to exist *before* private user data is
 * introduced; this is the first half, and ZunoOwnershipService is the second.
 */
@Injectable()
export class ZunoUserGuard implements CanActivate {
  constructor(
    private readonly resolver: ZunoUserResolverService,
    private readonly requestContext: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const principal = request.user;

    if (!principal) {
      throw new ZunoException(ZunoErrorCode.AUTHENTICATION_REQUIRED);
    }

    const zunoUser = await this.resolver.resolve(principal);
    request[ZUNO_USER_REQUEST_KEY] = zunoUser;

    // Correlate subsequent logs with the ZUNO id rather than anything
    // personally identifying (Step 21 section 15).
    this.requestContext.setUserRef(zunoUser.id);
    return true;
  }
}
