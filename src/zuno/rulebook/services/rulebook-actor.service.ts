import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../../users/entities/admin-user.entity';
import { GovernanceActor } from './rulebook-governance.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import { ZunoErrorCode } from '../../common/errors/error-codes.enum';
import {
  RULEBOOK_ROLE_PERMISSIONS,
  RulebookPermission,
  RulebookRole,
} from '../../common/enums';

/**
 * Resolves an authenticated admin into a rulebook governance actor.
 *
 * Step 21 section 107 requires explicit, auditable admin permissions rather
 * than one unrestricted admin path, and Build Rule 31 forbids creating a single
 * catch-all admin route for convenience.
 *
 * SPEC_GAP, recorded in ZUNO_DECISION_LOG.md item 13:
 * Step 10 section 25 names three governance roles - SYSTEM_ADMIN,
 * ASTROLOGY_SME and PRODUCT_ADMIN - but this project's existing RBAC
 * (`adm_role` / `adm_permission`) has no equivalent, and no mapping was
 * specified. Inventing an authorization model would be a material security
 * decision, which Build Rule 157 says not to take unilaterally.
 *
 * The interim mapping is therefore deliberately conservative and explicit,
 * driven by configuration rather than guessed from the existing role names:
 *
 *   ZUNO_RULEBOOK_SYSTEM_ADMINS   comma-separated admin emails
 *   ZUNO_RULEBOOK_SME_REVIEWERS   comma-separated admin emails
 *   ZUNO_RULEBOOK_PRODUCT_ADMINS  comma-separated admin emails
 *
 * An admin not listed in any of these gets SUPPORT (read-only). Nobody is
 * granted governance rights implicitly by being an admin, which is the
 * property that matters: the failure mode is "cannot act", not "can activate a
 * rulebook nobody reviewed".
 *
 * This must be replaced by real RBAC entries before production.
 */
@Injectable()
export class RulebookActorService {
  private readonly logger = new Logger(RulebookActorService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly admins: Repository<AdminUser>,
  ) {}

  async resolve(principal: {
    id?: number | string;
    unique_id?: string;
    email?: string | null;
    type?: string;
  }): Promise<GovernanceActor> {
    if (!principal || principal.type !== 'admin') {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        message: 'Rulebook management requires an administrator account.',
        internalDetail: 'non-admin principal on rulebook route',
      });
    }

    const admin = await this.admins.findOne({
      where: { unique_id: principal.unique_id, is_deleted: false },
    });
    if (!admin) {
      throw new ZunoException(ZunoErrorCode.FORBIDDEN, {
        internalDetail: 'admin record not found for principal',
      });
    }

    const role = this.roleFor(admin.email ?? '');
    const permissions = [...(RULEBOOK_ROLE_PERMISSIONS[role] ?? [])];

    return {
      // The admin's UUID, never the sequential id - it is what lands in the
      // audit trail (Step 20 section 140).
      userId: admin.unique_id,
      role,
      permissions,
    };
  }

  private roleFor(email: string): RulebookRole {
    const normalised = email.trim().toLowerCase();
    if (!normalised) return RulebookRole.SUPPORT;

    if (this.listFromEnv('ZUNO_RULEBOOK_SYSTEM_ADMINS').includes(normalised)) {
      return RulebookRole.SYSTEM_ADMIN;
    }
    if (this.listFromEnv('ZUNO_RULEBOOK_SME_REVIEWERS').includes(normalised)) {
      return RulebookRole.ASTROLOGY_SME;
    }
    if (this.listFromEnv('ZUNO_RULEBOOK_PRODUCT_ADMINS').includes(normalised)) {
      return RulebookRole.PRODUCT_ADMIN;
    }

    this.logger.debug(
      'Admin has no configured rulebook role; defaulting to read-only SUPPORT.',
    );
    return RulebookRole.SUPPORT;
  }

  private listFromEnv(key: string): string[] {
    return (process.env[key] ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  /** Convenience for controllers that need to check before doing work. */
  static has(actor: GovernanceActor, permission: RulebookPermission): boolean {
    return actor.permissions.includes(permission);
  }
}
