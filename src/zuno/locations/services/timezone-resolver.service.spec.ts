import {
  TimezoneResolverService,
  julianDayFromUtcMillis,
} from './timezone-resolver.service';

/**
 * These are not smoke tests. Every case below is a real historical rule that a
 * naive implementation gets wrong, and each one would silently rotate a birth
 * chart rather than fail visibly.
 */
describe('TimezoneResolverService', () => {
  const service = new TimezoneResolverService();

  describe('timezoneForCoordinates', () => {
    it('resolves major cities from coordinates', () => {
      expect(service.timezoneForCoordinates(19.076, 72.8777)).toBe('Asia/Kolkata');
      expect(service.timezoneForCoordinates(28.6139, 77.209)).toBe('Asia/Kolkata');
      expect(service.timezoneForCoordinates(25.2048, 55.2708)).toBe('Asia/Dubai');
      expect(service.timezoneForCoordinates(40.7128, -74.006)).toBe('America/New_York');
      expect(service.timezoneForCoordinates(51.5074, -0.1278)).toBe('Europe/London');
    });

    it('returns null rather than guessing for invalid coordinates', () => {
      expect(service.timezoneForCoordinates(91, 0)).toBeNull();
      expect(service.timezoneForCoordinates(0, 181)).toBeNull();
      expect(service.timezoneForCoordinates(NaN, 0)).toBeNull();
    });
  });

  describe('historical offsets', () => {
    it('uses IST +05:30 for an Indian birth', () => {
      const r = service.resolveLocalToUtc('1985-06-15', '14:30', 'Asia/Kolkata');
      expect(r.resolution).toBe('UNIQUE');
      expect(r.offsetMinutes).toBe(330);
      expect(r.utcIso).toBe('1985-06-15T09:00:00.000Z');
    });

    /**
     * Britain observed British Standard Time - UTC+1 all year round, no winter
     * reversion - from 27 Oct 1968 to 31 Oct 1971. A January birth in London in
     * that window is +01:00, not +00:00. Any implementation that assumes "UK in
     * winter means UTC" produces a chart an hour out.
     */
    it('applies British Standard Time (1968-1971) to a January London birth', () => {
      const r = service.resolveLocalToUtc('1970-01-15', '03:00', 'Europe/London');
      expect(r.resolution).toBe('UNIQUE');
      expect(r.offsetMinutes).toBe(60);
      expect(r.utcIso).toBe('1970-01-15T02:00:00.000Z');
    });

    it('applies GMT to a January London birth outside that window', () => {
      const r = service.resolveLocalToUtc('1975-01-15', '03:00', 'Europe/London');
      expect(r.resolution).toBe('UNIQUE');
      expect(r.offsetMinutes).toBe(0);
    });

    /**
     * The United States moved the start of DST from April to March in 2007.
     * A birth in mid-March is EST before the change and EDT after it.
     */
    it('honours the 2007 US daylight-saving boundary change', () => {
      const before = service.resolveLocalToUtc('2005-03-15', '12:00', 'America/New_York');
      const after = service.resolveLocalToUtc('2008-03-15', '12:00', 'America/New_York');
      expect(before.offsetMinutes).toBe(-300); // EST
      expect(after.offsetMinutes).toBe(-240); // EDT
    });
  });

  describe('ambiguous and nonexistent local times', () => {
    /**
     * 2024-11-03 01:30 in New York happened twice: once at UTC-04:00 (EDT) and
     * again an hour later at UTC-05:00 (EST). Both are real births. The system
     * must say so rather than pick one.
     */
    it('detects the repeated hour at a fall-back transition', () => {
      const r = service.resolveLocalToUtc('2024-11-03', '01:30', 'America/New_York');
      expect(r.resolution).toBe('AMBIGUOUS');
      expect(r.alternatives).toHaveLength(2);
      expect(r.alternatives[0].offsetMinutes).toBe(-240);
      expect(r.alternatives[1].offsetMinutes).toBe(-300);
      expect(r.alternatives[0].utcIso).toBe('2024-11-03T05:30:00.000Z');
      expect(r.alternatives[1].utcIso).toBe('2024-11-03T06:30:00.000Z');
    });

    /**
     * 2024-03-10 02:30 in New York never occurred; clocks jumped 02:00 to 03:00.
     * Reporting a converted instant here would be inventing a birth moment.
     */
    it('detects the skipped hour at a spring-forward transition', () => {
      const r = service.resolveLocalToUtc('2024-03-10', '02:30', 'America/New_York');
      expect(r.resolution).toBe('NONEXISTENT');
      expect(r.utcIso).toBeNull();
      expect(r.julianDayUt).toBeNull();
    });

    it('treats an hour either side of the gap as unique', () => {
      expect(
        service.resolveLocalToUtc('2024-03-10', '01:30', 'America/New_York').resolution,
      ).toBe('UNIQUE');
      expect(
        service.resolveLocalToUtc('2024-03-10', '03:30', 'America/New_York').resolution,
      ).toBe('UNIQUE');
    });

    it('never reports ambiguity for a zone without daylight saving', () => {
      for (const time of ['00:30', '01:30', '02:30', '23:59']) {
        const r = service.resolveLocalToUtc('2024-11-03', time, 'Asia/Kolkata');
        expect(r.resolution).toBe('UNIQUE');
        expect(r.offsetMinutes).toBe(330);
      }
    });
  });

  describe('unknown zones', () => {
    it('refuses an unrecognised zone rather than falling back to UTC', () => {
      const r = service.resolveLocalToUtc('1990-01-01', '12:00', 'Mars/Olympus_Mons');
      expect(r.resolution).toBe('NONEXISTENT');
      expect(r.utcIso).toBeNull();
    });

    it('recognises a real zone', () => {
      expect(service.isKnownTimezone('Asia/Kolkata')).toBe(true);
      expect(service.isKnownTimezone('Not/AZone')).toBe(false);
      expect(service.isKnownTimezone('')).toBe(false);
    });
  });

  describe('julianDayFromUtcMillis', () => {
    /** The Unix epoch is JD 2440587.5 by definition. */
    it('maps the Unix epoch exactly', () => {
      expect(julianDayFromUtcMillis(0)).toBe(2440587.5);
    });

    /** J2000.0 is 2000-01-01T12:00:00Z = JD 2451545.0 by definition. */
    it('maps J2000.0 exactly', () => {
      const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
      expect(julianDayFromUtcMillis(j2000)).toBe(2451545.0);
    });

    it('advances by exactly one per day', () => {
      const a = julianDayFromUtcMillis(Date.UTC(2024, 5, 1));
      const b = julianDayFromUtcMillis(Date.UTC(2024, 5, 2));
      expect(b - a).toBe(1);
    });
  });

  describe('time normalisation', () => {
    it('accepts HH:mm and HH:mm:ss identically', () => {
      const a = service.resolveLocalToUtc('1990-05-05', '07:45', 'Asia/Kolkata');
      const b = service.resolveLocalToUtc('1990-05-05', '07:45:00', 'Asia/Kolkata');
      expect(a.utcIso).toBe(b.utcIso);
    });
  });
});
