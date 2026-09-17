import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ZunoIdempotencyKey } from '../entities/zuno-idempotency-key.entity';
import { ZunoException } from '../errors/zuno.exception';
import { ZunoErrorCode } from '../errors/error-codes.enum';
import { ClockService } from './clock.service';

/** How long a key stays replayable. Long enough for client retry, short
 *  enough that the table does not grow without bound. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(ZunoIdempotencyKey)
    private readonly keys: Repository<ZunoIdempotencyKey>,
    private readonly clock: ClockService,
  ) {}

  /**
   * Runs `work` at most once for a given (operation, key) pair.
   *
   * Step 21 section 16 / Build Rule 27. The Golden Contract Test in Step 21
   * section 126 defines the expected behaviour: a retried plan completion
   * produces one completion, one event and one Karma action.
   *
   * Returns the stored reference on replay rather than re-running, so side
   * effects such as outbox events are not duplicated.
   *
   * When no key is supplied the work simply runs - idempotency is opt-in by the
   * client per Step 21 section 16, which lists the operations that need it.
   */
  async execute<T extends Record<string, unknown>>(
    params: {
      operation: string;
      key: string | undefined;
      userId: string | null;
      requestBody: unknown;
      ttlMs?: number;
    },
    work: () => Promise<T>,
  ): Promise<T> {
    const { operation, key, userId, requestBody } = params;
    if (!key) {
      return work();
    }

    const requestHash = hashBody(requestBody);
    const existing = await this.keys.findOne({
      where: { operation, idempotency_key: key },
    });

    if (existing) {
      // Same key, different body: the client has a bug, and replaying the old
      // result would be worse than refusing. Step 21 section 16 does not
      // define this case explicitly, so we fail loudly rather than guess.
      if (existing.request_hash !== requestHash) {
        throw new ZunoException(ZunoErrorCode.CONFLICT, {
          internalDetail: `idempotency key reused with a different request body for ${operation}`,
        });
      }
      if (existing.status === 'COMPLETED' && existing.response_reference) {
        return existing.response_reference as T;
      }
      if (existing.status === 'IN_PROGRESS') {
        // A concurrent duplicate is still running. Honest PROCESSING beats a
        // fabricated success (Build Rule 128).
        throw new ZunoException(ZunoErrorCode.PROCESSING, {
          internalDetail: `duplicate in-flight request for ${operation}`,
        });
      }
      // Previous attempt FAILED - allow a genuine retry to proceed.
      await this.keys.delete({ id: existing.id });
    }

    const reservation = await this.keys.save(
      this.keys.create({
        operation,
        idempotency_key: key,
        user_id: userId,
        request_hash: requestHash,
        status: 'IN_PROGRESS',
        response_reference: null,
        expires_at: new Date(
          this.clock.now().getTime() + (params.ttlMs ?? DEFAULT_TTL_MS),
        ),
      }),
    );

    try {
      const result = await work();
      await this.keys.update(
        { id: reservation.id },
        { status: 'COMPLETED', response_reference: result },
      );
      return result;
    } catch (error) {
      await this.keys.update({ id: reservation.id }, { status: 'FAILED' });
      throw error;
    }
  }
}

function hashBody(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(body ?? null))
    .digest('hex');
}
