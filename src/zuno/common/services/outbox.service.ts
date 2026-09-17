import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ZunoEventOutbox } from '../entities/zuno-event-outbox.entity';
import {
  OutboxStatus,
  ZunoAggregateType,
  ZunoEventType,
} from '../enums';
import { RequestContextService } from './request-context.service';

export interface OutboxEventInput {
  aggregateType: ZunoAggregateType;
  aggregateId: string;
  eventType: ZunoEventType;
  payload: Record<string, unknown>;
  eventVersion?: string;
}

/**
 * Writes domain events into the transactional outbox.
 * Step 20 Data Model sections 105-106, Build Rule 77.
 *
 * Every method takes an EntityManager rather than using an injected repository,
 * and that is the whole point: the event row must be written inside the *same*
 * transaction as the state change it describes. An injected repository would
 * open its own connection and reintroduce exactly the drift the outbox exists
 * to prevent.
 *
 * Usage:
 *   await dataSource.transaction(async (m) => {
 *     await m.save(challenge);
 *     await outbox.enqueue(m, { ... });
 *   });
 *
 * A separate relay process (not part of this phase) moves PENDING rows to the
 * message bus. Until it exists, events accumulate durably rather than being
 * lost - which is the correct failure mode.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly requestContext: RequestContextService) {}

  async enqueue(
    manager: EntityManager,
    event: OutboxEventInput,
  ): Promise<ZunoEventOutbox> {
    const row = manager.create(ZunoEventOutbox, {
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      event_version: event.eventVersion ?? '1',
      payload: this.assertNoSensitiveKeys(event.payload),
      status: OutboxStatus.PENDING,
      published_at: null,
      retry_count: 0,
      last_error: null,
      request_id: this.requestContext.get()?.requestId ?? null,
    });
    return manager.save(ZunoEventOutbox, row);
  }

  async enqueueMany(
    manager: EntityManager,
    events: OutboxEventInput[],
  ): Promise<void> {
    for (const event of events) {
      await this.enqueue(manager, event);
    }
  }

  /**
   * Build Rule 113: queue messages carry ids, not sensitive payloads.
   *
   * A consumer should re-read authorised state rather than trusting whatever
   * was serialised at publish time. This is a development guard-rail, not a
   * security boundary - it catches the easy mistake of dropping a raw statement
   * or birth date into an event while writing new code.
   */
  private assertNoSensitiveKeys(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const forbidden = [
      'raw_user_statement',
      'statement',
      'date_of_birth',
      'time_of_birth',
      'latitude',
      'longitude',
      'password',
      'token',
      'content',
      'message',
    ];
    const offending = Object.keys(payload).filter((key) =>
      forbidden.includes(key),
    );
    if (offending.length > 0) {
      this.logger.warn(
        `Outbox payload contained disallowed key(s): ${offending.join(', ')}. Dropping them; publish ids instead.`,
      );
      const cleaned = { ...payload };
      for (const key of offending) delete cleaned[key];
      return cleaned;
    }
    return payload;
  }
}
