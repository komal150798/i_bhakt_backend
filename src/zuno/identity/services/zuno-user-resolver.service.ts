import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoUserProfile } from '../entities/zuno-user-profile.entity';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import { OnboardingStatus, ZunoUserStatus } from '../../common/enums';
import { Customer } from '../../../users/entities/customer.entity';

/**
 * Identity from the authenticated request, as produced by the existing
 * JwtStrategy in `src/auth/strategies/jwt.strategy.ts`.
 */
export interface AuthenticatedPrincipal {
  id: number | string;
  unique_id: string;
  type: 'user' | 'admin';
  email?: string | null;
  phone_number?: string | null;
}

/**
 * Resolves the authenticated principal to a ZUNO user.
 *
 * This is the seam between the existing iBhakt customer identity and ZUNO's own
 * identity model. Step 21 section 9 and Rule 6 are the reason it exists at all:
 * the server derives identity from the validated token, never from a user id
 * supplied by the client.
 *
 * ZUNO users are created lazily on first contact rather than backfilled, so
 * existing customers who never open ZUNO do not get rows they do not need, and
 * onboarding stays progressive (Step 30 Phase 2 section 18).
 */
@Injectable()
export class ZunoUserResolverService {
  private readonly logger = new Logger(ZunoUserResolverService.name);

  constructor(
    @InjectRepository(ZunoUser)
    private readonly users: Repository<ZunoUser>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Returns the ZUNO user for this principal, creating it on first use.
   *
   * Admin principals are rejected: ZUNO user data is not reachable through an
   * admin token. Step 21 section 113 - "System Admin access does not imply
   * unrestricted user-data access".
   */
  async resolve(principal: AuthenticatedPrincipal): Promise<ZunoUser> {
    if (!principal?.unique_id) {
      throw new ZunoException(ZunoErrorCode.AUTHENTICATION_REQUIRED, {
        internalDetail: 'principal missing unique_id',
      });
    }
    if (principal.type === 'admin') {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        internalDetail: 'admin principal cannot access ZUNO user endpoints',
      });
    }

    const existing = await this.users.findOne({
      where: { auth_subject: principal.unique_id },
    });

    if (existing) {
      this.assertUsable(existing);
      return existing;
    }

    return this.provision(principal);
  }

  /**
   * Creates the ZUNO identity plus an empty profile in one transaction.
   *
   * Seeds timezone/locale from the existing customer record where available -
   * this is a copy of data the user already gave iBhakt, not an inference.
   * Build Rule 52's prohibition is on inventing values; carrying across a value
   * the user actually provided is not inventing.
   */
  private async provision(principal: AuthenticatedPrincipal): Promise<ZunoUser> {
    const customer = await this.customers.findOne({
      where: { unique_id: principal.unique_id, is_deleted: false },
    });

    return this.dataSource.transaction(async (manager) => {
      // Re-check inside the transaction: two concurrent first requests from the
      // same user would otherwise both see "no row" and both insert.
      const raced = await manager.findOne(ZunoUser, {
        where: { auth_subject: principal.unique_id },
      });
      if (raced) return raced;

      const user = manager.create(ZunoUser, {
        auth_subject: principal.unique_id,
        customer_id: customer ? String(customer.id) : null,
        status: ZunoUserStatus.ACTIVE,
        timezone: customer?.timezone ?? null,
        locale: null,
        onboarding_status: OnboardingStatus.NOT_STARTED,
      });
      const saved = await manager.save(ZunoUser, user);

      const profile = manager.create(ZunoUserProfile, {
        user_id: saved.id,
        preferred_name: customer?.first_name ?? null,
        display_name: customer?.full_name ?? null,
        country_code: null,
        city: null,
        occupation: null,
        preferred_language: null,
      });
      await manager.save(ZunoUserProfile, profile);

      this.logger.log(`Provisioned ZUNO user ${saved.id}`);
      return saved;
    });
  }

  private assertUsable(user: ZunoUser): void {
    if (
      user.status === ZunoUserStatus.DELETED ||
      user.status === ZunoUserStatus.PENDING_DELETION
    ) {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        internalDetail: `zuno user ${user.id} status ${user.status}`,
      });
    }
    if (user.status === ZunoUserStatus.SUSPENDED) {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        internalDetail: `zuno user ${user.id} suspended`,
      });
    }
  }
}
