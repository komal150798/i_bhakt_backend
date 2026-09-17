import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { createHash } from 'crypto';
import { ZunoAuditEvent } from '../entities/zuno-audit-event.entity';
import { RequestContextService } from './request-context.service';

export interface AuditInput {
  actorType: 'USER' | 'ADMIN' | 'SYSTEM' | 'SERVICE';
  actorId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Records auditable state changes. Step 20 Data Model section 79,
 * Build Rule 15 of the Master Index ("maintain auditability for important
 * decisions").
 *
 * Deliberately hashes before/after rather than storing them. Step 20 section 79
 * says to avoid unnecessary raw sensitive values, and an audit table typically
 * has a longer retention than the data it describes - copying a user's private
 * challenge text into it would quietly defeat the retention policy on the
 * original.
 *
 * Comparing hashes still answers the questions audit needs to answer: did this
 * change, was it the change we expected, did anything alter it since.
 */
@Injectable()
export class ZunoAuditService {
  constructor(private readonly requestContext: RequestContextService) {}

  async record(manager: EntityManager, input: AuditInput): Promise<void> {
    const row = manager.create(ZunoAuditEvent, {
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      user_id: input.userId ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      before_hash: input.before === undefined ? null : hashValue(input.before),
      after_hash: input.after === undefined ? null : hashValue(input.after),
      metadata: {
        ...(input.metadata ?? {}),
        requestId: this.requestContext.get()?.requestId ?? null,
      },
      redacted_at: null,
    });
    await manager.save(ZunoAuditEvent, row);
  }
}

function hashValue(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value ?? null))
    .digest('hex');
}
