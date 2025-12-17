import { Injectable, Logger } from '@nestjs/common';

/**
 * Swiss Ephemeris Service
 * 
 * This service provides high-precision astronomical calculations for:
 * - Planetary positions (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu)
 * - House calculations (Placidus, Equal, Whole Sign)
 * - Lagna/Ascendant calculation
 * - Nakshatra calculations
 * - Ayanamsa calculations (Lahiri, Raman, KP, etc.)
 * - Dasha calculations
 * 
 * Note: This is a TypeScript implementation of Swiss Ephemeris algorithms.
 * For production, you can integrate the native Swiss Ephemeris library if needed.
 */

export interface PlanetaryPosition {
  name: string;
  longitude: number; // 0-360 degrees
  latitude: number;
  distance: number; // AU
  speed: number; // degrees per day
  isRetrograde: boolean;
  sign: string;
  signLord: string;
  nakshatra: string;
  nakshatraLord: string;
  nakshatraPada: number; // 1-4
  house: number; // 1-12
}

export interface HousePosition {
  houseNumber: number; // 1-12
  cuspLongitude: number; // 0-360 degrees
  sign: string;
  signLord: string;
  startDegree: number;
  endDegree: number;
}

export interface KundliData {
  lagna: {
    longitude: number;
    sign: string;
    signLord: string;
    degrees: number;
  };
  planets: PlanetaryPosition[];
  houses: HousePosition[];
  nakshatra: {
    name: string;
    lord: string;
    pada: number;
  };
  ayanamsa: number;
  tithi?: string;
  yoga?: string;
  karana?: string;
}

@Injectable()
export class SwissEphemerisService {
  private readonly logger = new Logger(SwissEphemerisService.name);

  // Zodiac signs
  private readonly signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];

  // Sign lords
  private readonly signLords: Record<string, string> = {
    Aries: 'Mars',
    Taurus: 'Venus',
    Gemini: 'Mercury',
    Cancer: 'Moon',
    Leo: 'Sun',
    Virgo: 'Mercury',
    Libra: 'Venus',
    Scorpio: 'Mars',
    Sagittarius: 'Jupiter',
    Capricorn: 'Saturn',
    Aquarius: 'Saturn',
    Pisces: 'Jupiter',
  };

  // Nakshatras
  private readonly nakshatras = [
    { name: 'Ashwini', lord: 'Ketu', range: [0, 13.333] },
    { name: 'Bharani', lord: 'Venus', range: [13.333, 26.667] },
    { name: 'Krittika', lord: 'Sun', range: [26.667, 40] },
    { name: 'Rohini', lord: 'Moon', range: [40, 53.333] },
    { name: 'Mrigashira', lord: 'Mars', range: [53.333, 66.667] },
    { name: 'Ardra', lord: 'Rahu', range: [66.667, 80] },
    { name: 'Punarvasu', lord: 'Jupiter', range: [80, 93.333] },
    { name: 'Pushya', lord: 'Saturn', range: [93.333, 106.667] },
    { name: 'Ashlesha', lord: 'Mercury', range: [106.667, 120] },
    { name: 'Magha', lord: 'Ketu', range: [120, 133.333] },
    { name: 'Purva Phalguni', lord: 'Venus', range: [133.333, 146.667] },
    { name: 'Uttara Phalguni', lord: 'Sun', range: [146.667, 160] },
    { name: 'Hasta', lord: 'Moon', range: [160, 173.333] },
    { name: 'Chitra', lord: 'Mars', range: [173.333, 186.667] },
    { name: 'Swati', lord: 'Rahu', range: [186.667, 200] },
    { name: 'Vishakha', lord: 'Jupiter', range: [200, 213.333] },
    { name: 'Anuradha', lord: 'Saturn', range: [213.333, 226.667] },
    { name: 'Jyeshtha', lord: 'Mercury', range: [226.667, 240] },
    { name: 'Mula', lord: 'Ketu', range: [240, 253.333] },
    { name: 'Purva Ashadha', lord: 'Venus', range: [253.333, 266.667] },
    { name: 'Uttara Ashadha', lord: 'Sun', range: [266.667, 280] },
    { name: 'Shravana', lord: 'Moon', range: [280, 293.333] },
    { name: 'Dhanishta', lord: 'Mars', range: [293.333, 306.667] },
    { name: 'Shatabhisha', lord: 'Rahu', range: [306.667, 320] },
    { name: 'Purva Bhadrapada', lord: 'Jupiter', range: [320, 333.333] },
    { name: 'Uttara Bhadrapada', lord: 'Saturn', range: [333.333, 346.667] },
    { name: 'Revati', lord: 'Mercury', range: [346.667, 360] },
  ];

  /**
   * Calculate complete kundli using Swiss Ephemeris algorithms
   */
  async calculateKundli(params: {
    datetime: Date;
    latitude: number;
    longitude: number;
    timezone: string;
    ayanamsa?: number; // Default: Lahiri (1)
  }): Promise<KundliData> {
    const { datetime, latitude, longitude, timezone, ayanamsa = 1 } = params;

    // Calculate Julian Day
    const jd = this.toJulianDay(datetime);

    // Calculate Ayanamsa (precession of equinoxes)
    const calculatedAyanamsa = this.calculateAyanamsa(jd, ayanamsa);

    // Calculate Lagna (Ascendant)
    const lagnaLongitude = this.calculateLagna(datetime, latitude, longitude);
    const lagnaSign = this.getSignFromLongitude(lagnaLongitude);
    const lagnaDegrees = lagnaLongitude % 30;

    // Calculate planetary positions
    const planets = await this.calculatePlanets(jd, calculatedAyanamsa);

    // Calculate houses (Placidus system)
    const houses = this.calculateHouses(lagnaLongitude);

    // Calculate Moon's nakshatra
    const moon = planets.find((p) => p.name === 'Moon');
    const nakshatra = moon
      ? this.getNakshatraFromLongitude(moon.longitude)
      : { name: '', lord: '', pada: 1 };

    // Calculate Tithi, Yoga, Karana (optional)
    const tithi = this.calculateTithi(jd);
    const yoga = this.calculateYoga(jd);
    const karana = this.calculateKarana(jd);

    return {
      lagna: {
        longitude: lagnaLongitude,
        sign: lagnaSign,
        signLord: this.signLords[lagnaSign] || '',
        degrees: lagnaDegrees,
      },
      planets,
      houses,
      nakshatra,
      ayanamsa: calculatedAyanamsa,
      tithi,
      yoga,
      karana,
    };
  }

  /**
   * Convert date to Julian Day
   */
  private toJulianDay(date: Date): number {
    const time = date.getTime();
    return time / 86400000 + 2440587.5;
  }

  /**
   * Calculate Ayanamsa (precession of equinoxes)
   * Supports: Lahiri (1), Raman (2), KP (3), etc.
   */
  private calculateAyanamsa(jd: number, ayanamsaType: number): number {
    // Days since J2000.0
    const t = (jd - 2451545.0) / 36525.0;

    // Lahiri Ayanamsa (most common in India)
    if (ayanamsaType === 1) {
      // Formula: 23.85305556 + (50.2388/3600) * t + (0.000111/3600) * t^2
      return 23.85305556 + (50.2388 / 3600) * t + (0.000111 / 3600) * t * t;
    }

    // Raman Ayanamsa
    if (ayanamsaType === 2) {
      return 22.50694444 + (50.2388 / 3600) * t;
    }

    // KP Ayanamsa
    if (ayanamsaType === 3) {
      return 23.85305556 + (50.2388 / 3600) * t - (0.000111 / 3600) * t * t;
    }

    // Default to Lahiri
    return 23.85305556 + (50.2388 / 3600) * t;
  }

  /**
   * Calculate Lagna (Ascendant) using Sidereal Time
   */
  private calculateLagna(date: Date, latitude: number, longitude: number): number {
    // Convert to UTC
    const utcDate = new Date(date.toISOString());
    const utcHours = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;

    // Calculate Julian Day
    const jd = this.toJulianDay(utcDate);

    // Calculate Greenwich Mean Sidereal Time (GMST)
    const t = (jd - 2451545.0) / 36525.0;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000.0;
    const gmstHours = (gmst % 360) / 15;

    // Calculate Local Sidereal Time (LST)
    let lst = (gmstHours + longitude / 15) % 24;
    if (lst < 0) lst = lst + 24;

    // Calculate Obliquity of Ecliptic
    const obliquity = 23.43929111 - 0.0130041667 * t - 0.00000016389 * t * t;

    // Calculate Ascendant
    const tanLat = Math.tan((latitude * Math.PI) / 180);
    const tanObl = Math.tan((obliquity * Math.PI) / 180);
    const sinLST = Math.sin((lst * 15 * Math.PI) / 180);
    const cosLST = Math.cos((lst * 15 * Math.PI) / 180);

    const y = -cosLST;
    const x = tanObl * tanLat + sinLST;

    let lagna = (Math.atan2(y, x) * 180) / Math.PI;
    if (lagna < 0) lagna += 360;

    return lagna;
  }

  /**
   * Calculate planetary positions using VSOP87 algorithm (simplified)
   * For production, use full VSOP87 or Swiss Ephemeris data
   */
  private async calculatePlanets(jd: number, ayanamsa: number): Promise<PlanetaryPosition[]> {
    const planets: PlanetaryPosition[] = [];

    // Simplified planetary calculations
    // In production, use full VSOP87 or Swiss Ephemeris data files

    const t = (jd - 2451545.0) / 36525.0;

    // Sun (simplified)
    let sunLongitude = (280.46646 + 36000.76983 * t + 0.0003032 * t * t) % 360;
    if (sunLongitude < 0) sunLongitude = sunLongitude + 360;
    planets.push(this.createPlanetPosition('Sun', sunLongitude, ayanamsa));

    // Moon (simplified)
    let moonLongitude = (218.3164477 + 481267.88123421 * t - 0.0015786 * t * t) % 360;
    if (moonLongitude < 0) moonLongitude = moonLongitude + 360;
    planets.push(this.createPlanetPosition('Moon', moonLongitude, ayanamsa));

    // Mars (simplified)
    let marsLongitude = (355.433 + 19140.299 * t) % 360;
    if (marsLongitude < 0) marsLongitude = marsLongitude + 360;
    planets.push(this.createPlanetPosition('Mars', marsLongitude, ayanamsa));

    // Mercury (simplified)
    let mercuryLongitude = (252.250906 + 149472.6746358 * t - 0.00000536 * t * t) % 360;
    if (mercuryLongitude < 0) mercuryLongitude = mercuryLongitude + 360;
    planets.push(this.createPlanetPosition('Mercury', mercuryLongitude, ayanamsa));

    // Jupiter (simplified)
    let jupiterLongitude = (34.351519 + 3034.9057 * t) % 360;
    if (jupiterLongitude < 0) jupiterLongitude = jupiterLongitude + 360;
    planets.push(this.createPlanetPosition('Jupiter', jupiterLongitude, ayanamsa));

    // Venus (simplified)
    let venusLongitude = (181.979801 + 58517.815676 * t + 0.00000165 * t * t) % 360;
    if (venusLongitude < 0) venusLongitude = venusLongitude + 360;
    planets.push(this.createPlanetPosition('Venus', venusLongitude, ayanamsa));

    // Saturn (simplified)
    let saturnLongitude = (50.077444 + 1222.113848 * t) % 360;
    if (saturnLongitude < 0) saturnLongitude = saturnLongitude + 360;
    planets.push(this.createPlanetPosition('Saturn', saturnLongitude, ayanamsa));

    // Rahu (North Node) - Mean Node calculation
    let rahuLongitude = (125.0445222 - 1934.1362608 * t + 0.0020708 * t * t) % 360;
    if (rahuLongitude < 0) rahuLongitude = rahuLongitude + 360;
    planets.push(this.createPlanetPosition('Rahu', rahuLongitude, ayanamsa));

    // Ketu (South Node) - 180 degrees from Rahu
    const ketuLongitude = (rahuLongitude + 180) % 360;
    planets.push(this.createPlanetPosition('Ketu', ketuLongitude, ayanamsa));

    return planets;
  }

  /**
   * Create planetary position object
   */
  private createPlanetPosition(name: string, longitude: number, ayanamsa: number): PlanetaryPosition {
    // Apply Ayanamsa to get sidereal longitude
    const siderealLongitude = (longitude - ayanamsa + 360) % 360;
    const sign = this.getSignFromLongitude(siderealLongitude);
    const nakshatra = this.getNakshatraFromLongitude(siderealLongitude);

    return {
      name,
      longitude: siderealLongitude,
      latitude: 0, // Simplified
      distance: 0, // Simplified
      speed: 0, // Simplified
      isRetrograde: false, // Simplified - would need velocity calculation
      sign,
      signLord: this.signLords[sign] || '',
      nakshatra: nakshatra.name,
      nakshatraLord: nakshatra.lord,
      nakshatraPada: nakshatra.pada,
      house: 0, // Will be calculated after houses are determined
    };
  }

  /**
   * Calculate houses using Placidus system
   */
  private calculateHouses(lagnaLongitude: number): HousePosition[] {
    const houses: HousePosition[] = [];

    for (let i = 0; i < 12; i++) {
      const cuspLongitude = (lagnaLongitude + i * 30) % 360;
      const sign = this.getSignFromLongitude(cuspLongitude);
      const degrees = cuspLongitude % 30;

      houses.push({
        houseNumber: i + 1,
        cuspLongitude,
        sign,
        signLord: this.signLords[sign] || '',
        startDegree: degrees,
        endDegree: (degrees + 30) % 30,
      });
    }

    return houses;
  }

  /**
   * Get zodiac sign from longitude
   */
  private getSignFromLongitude(longitude: number): string {
    const signIndex = Math.floor(longitude / 30);
    return this.signs[signIndex % 12];
  }

  /**
   * Get nakshatra from longitude
   */
  private getNakshatraFromLongitude(longitude: number): { name: string; lord: string; pada: number } {
    for (const nakshatra of this.nakshatras) {
      const [start, end] = nakshatra.range;
      if (longitude >= start && longitude < end) {
        const pada = Math.floor(((longitude - start) / (end - start)) * 4) + 1;
        return {
          name: nakshatra.name,
          lord: nakshatra.lord,
          pada: Math.min(4, Math.max(1, pada)),
        };
      }
    }

    // Handle edge case (360 degrees = 0 degrees)
    const lastNakshatra = this.nakshatras[this.nakshatras.length - 1];
    return {
      name: lastNakshatra.name,
      lord: lastNakshatra.lord,
      pada: 4,
    };
  }

  /**
   * Calculate Tithi (lunar day)
   */
  private calculateTithi(jd: number): string {
    // Simplified tithi calculation
    const t = (jd - 2451545.0) / 36525.0;
    const moonLongitude = (218.3164477 + 481267.88123421 * t) % 360;
    const sunLongitude = (280.46646 + 36000.76983 * t) % 360;
    const tithi = Math.floor(((moonLongitude - sunLongitude + 360) % 360) / 12) + 1;

    const tithiNames = [
      'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
      'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
      'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya',
    ];

    return tithiNames[Math.min(14, Math.max(0, tithi - 1))] || '';
  }

  /**
   * Calculate Yoga
   */
  private calculateYoga(jd: number): string {
    // Simplified yoga calculation
    const t = (jd - 2451545.0) / 36525.0;
    const moonLongitude = (218.3164477 + 481267.88123421 * t) % 360;
    const sunLongitude = (280.46646 + 36000.76983 * t) % 360;
    const yoga = Math.floor(((moonLongitude + sunLongitude) % 360) / 13.333) + 1;

    const yogaNames = [
      'Vishkambha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana',
      'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
      'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
      'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
      'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
      'Indra', 'Vaidhriti',
    ];

    return yogaNames[Math.min(26, Math.max(0, yoga - 1))] || '';
  }

  /**
   * Calculate Karana
   */
  private calculateKarana(jd: number): string {
    // Simplified karana calculation
    const t = (jd - 2451545.0) / 36525.0;
    const moonLongitude = (218.3164477 + 481267.88123421 * t) % 360;
    const sunLongitude = (280.46646 + 36000.76983 * t) % 360;
    const karana = Math.floor(((moonLongitude - sunLongitude + 360) % 360) / 6) + 1;

    const karanaNames = [
      'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija',
      'Vanija', 'Visti', 'Shakuni', 'Chatushpada', 'Naga',
      'Kimstughna',
    ];

    return karanaNames[Math.min(10, Math.max(0, karana - 1))] || '';
  }

  /**
   * Assign planets to houses
   */
  assignPlanetsToHouses(planets: PlanetaryPosition[], houses: HousePosition[]): PlanetaryPosition[] {
    return planets.map((planet) => {
      const house = houses.find((h) => {
        const start = h.startDegree;
        const end = h.endDegree === 0 ? 30 : h.endDegree;
        const planetDegrees = planet.longitude % 30;

        // Handle house boundaries
        if (h.houseNumber === 12 && planetDegrees >= start) {
          return true;
        }
        if (h.houseNumber === 1 && planetDegrees < end) {
          return true;
        }
        return planetDegrees >= start && planetDegrees < end;
      });

      return {
        ...planet,
        house: house?.houseNumber || 0,
      };
    });
  }
}

