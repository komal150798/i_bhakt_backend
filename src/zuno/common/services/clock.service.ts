import { Injectable } from '@nestjs/common';

/**
 * Injectable clock.
 *
 * Build Rule 105: time-sensitive logic must use an injectable, testable clock
 * rather than scattering `new Date()` through domain code. ZUNO needs this
 * because plan windows, MKA periods, quiet hours and Life Signal ordering are
 * all date-boundary sensitive, and those boundaries have to be reproducible in
 * Golden Journey tests.
 *
 * Step 20 section 6: everything here is UTC. Converting to the user's timezone
 * is done deliberately at the API edge, never implicitly in domain logic.
 */
@Injectable()
export class ClockService {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }

  /** UTC calendar date as YYYY-MM-DD, the form used by DATE columns. */
  today(): string {
    return this.now().toISOString().slice(0, 10);
  }
}

/**
 * Test double. Kept beside the real implementation so a test never has to
 * hand-roll a partial mock that drifts from the interface.
 */
export class FixedClockService extends ClockService {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date | string): void {
    this.current = new Date(date);
  }

  advanceMs(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
