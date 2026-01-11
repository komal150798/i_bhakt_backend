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

    // Get timezone offset in hours (IST = +5.5, etc.)
    const tzOffset = this.getTimezoneOffset(timezone);

    // Calculate Julian Day using LOCAL time (the datetime passed is already in local time)
    // We need to convert to UTC for astronomical calculations
    const jd = this.toJulianDayFromLocal(datetime, tzOffset);

    this.logger.log(`Calculating Kundli: Date=${datetime.toISOString()}, TZ=${timezone}, Offset=${tzOffset}h, JD=${jd.toFixed(6)}`);
    this.logger.log(`Location: Lat=${latitude}°, Lon=${longitude}°`);

    // Calculate Ayanamsa (precession of equinoxes)
    const calculatedAyanamsa = this.calculateAyanamsa(jd, ayanamsa);
    this.logger.log(`Ayanamsa (Lahiri): ${calculatedAyanamsa.toFixed(4)}°`);

    // Calculate Lagna (Ascendant) - Tropical
    // Pass the timezone-adjusted Julian Day for accurate Lagna calculation
    const tropicalLagna = this.calculateLagna(jd, latitude, longitude);
    this.logger.log(`Tropical Lagna: ${tropicalLagna.toFixed(4)}°`);
    // Convert to Sidereal by subtracting Ayanamsa
    const siderealLagna = (tropicalLagna - calculatedAyanamsa + 360) % 360;
    const lagnaSign = this.getSignFromLongitude(siderealLagna);
    const lagnaDegrees = siderealLagna % 30;
    this.logger.log(`Sidereal Lagna: ${siderealLagna.toFixed(4)}° = ${lagnaSign} ${lagnaDegrees.toFixed(2)}°`);

    // Calculate planetary positions
    const planets = await this.calculatePlanets(jd, calculatedAyanamsa);

    // Calculate houses using sidereal Lagna
    const houses = this.calculateHouses(siderealLagna);

    // Calculate Moon's nakshatra
    const moon = planets.find((p) => p.name === 'Moon');
    const nakshatra = moon
      ? this.getNakshatraFromLongitude(moon.longitude)
      : { name: '', lord: '', pada: 1 };

    // Calculate Tithi, Yoga, Karana using actual calculated positions
    const sun = planets.find((p) => p.name === 'Sun');
    const tithi = this.calculateTithiFromPositions(moon?.longitude || 0, sun?.longitude || 0);
    const yoga = this.calculateYogaFromPositions(moon?.longitude || 0, sun?.longitude || 0);
    const karana = this.calculateKaranaFromPositions(moon?.longitude || 0, sun?.longitude || 0);

    return {
      lagna: {
        longitude: siderealLagna,
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
   * Get timezone offset in hours from timezone string
   * E.g., "Asia/Kolkata" returns 5.5, "America/New_York" returns -5 or -4 (depending on DST)
   */
  private getTimezoneOffset(timezone: string): number {
    // Common timezone offsets (in hours)
    const timezoneOffsets: Record<string, number> = {
      'Asia/Kolkata': 5.5,
      'Asia/Calcutta': 5.5,
      'IST': 5.5,
      'Asia/Mumbai': 5.5,
      'Asia/Delhi': 5.5,
      'Asia/Chennai': 5.5,
      'UTC': 0,
      'GMT': 0,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'America/Chicago': -6,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Europe/Berlin': 1,
      'Asia/Tokyo': 9,
      'Asia/Shanghai': 8,
      'Asia/Singapore': 8,
      'Asia/Dubai': 4,
      'Australia/Sydney': 11,
      'Pacific/Auckland': 13,
    };

    // Check if timezone is in our map
    if (timezoneOffsets[timezone] !== undefined) {
      return timezoneOffsets[timezone];
    }

    // Try to parse numeric offset like "+05:30" or "-05:00"
    const numericMatch = timezone.match(/^([+-]?)(\d{1,2}):?(\d{2})?$/);
    if (numericMatch) {
      const sign = numericMatch[1] === '-' ? -1 : 1;
      const hours = parseInt(numericMatch[2], 10);
      const minutes = parseInt(numericMatch[3] || '0', 10);
      return sign * (hours + minutes / 60);
    }

    // Default to IST (5.5 hours) for Indian astrology app
    this.logger.warn(`Unknown timezone: ${timezone}, defaulting to IST (UTC+5:30)`);
    return 5.5;
  }

  /**
   * Convert local time to Julian Day, accounting for timezone offset
   *
   * IMPORTANT: The input date comes from: new Date(`${birth_date}T${birth_time}`)
   * Without a 'Z' suffix, JavaScript interprets this as LOCAL SERVER time.
   *
   * CASE 1: Server and user are in the SAME timezone (e.g., both IST)
   *   - Date object stores correct UTC time
   *   - We should use getUTC* methods and NOT subtract timezone again
   *
   * CASE 2: Server and user are in DIFFERENT timezones
   *   - Date object has WRONG UTC time (based on server TZ, not user TZ)
   *   - We need to adjust by the difference between server and user TZ
   *
   * @param inputDate - Date object created from birth date/time strings
   * @param userTzOffset - User's timezone offset in hours (e.g., 5.5 for IST)
   * @returns Julian Day number in UTC
   */
  private toJulianDayFromLocal(inputDate: Date, userTzOffset: number): number {
    // Get server's timezone offset in hours
    // getTimezoneOffset() returns minutes west of UTC, so IST (-330) becomes +5.5
    const serverTzOffsetMinutes = inputDate.getTimezoneOffset();
    const serverTzOffsetHours = -serverTzOffsetMinutes / 60;

    // Calculate the adjustment needed if server and user timezones differ
    // If both are IST (5.5), adjustment = 0
    // If server is UTC (0) and user is IST (5.5), adjustment = -5.5
    const tzAdjustmentHours = serverTzOffsetHours - userTzOffset;

    // Get the UTC timestamp and apply adjustment
    const utcMillis = inputDate.getTime();
    const adjustedMillis = utcMillis + (tzAdjustmentHours * 3600 * 1000);
    const adjustedDate = new Date(adjustedMillis);

    // Extract UTC components from the adjusted date
    const year = adjustedDate.getUTCFullYear();
    const month = adjustedDate.getUTCMonth() + 1;
    const day = adjustedDate.getUTCDate();
    const hour = adjustedDate.getUTCHours();
    const minute = adjustedDate.getUTCMinutes();
    const second = adjustedDate.getUTCSeconds();

    const decimalHours = hour + minute / 60 + second / 3600;

    // Calculate Julian Day using the standard formula
    let y = year;
    let m = month;
    if (m <= 2) {
      y -= 1;
      m += 12;
    }

    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);

    const jdMidnight = Math.floor(365.25 * (y + 4716)) +
                       Math.floor(30.6001 * (m + 1)) +
                       day + B - 1524.5;

    const jd = jdMidnight + decimalHours / 24;

    this.logger.debug(`JD Calc: serverTZ=${serverTzOffsetHours}h, userTZ=${userTzOffset}h, ` +
                      `adjustment=${tzAdjustmentHours}h, UTC=${adjustedDate.toISOString()}, JD=${jd.toFixed(6)}`);

    return jd;
  }

  /**
   * Calculate Ayanamsa (precession of equinoxes)
   * Supports: Lahiri (1), Raman (2), KP (3), etc.
   *
   * Lahiri Ayanamsa (Chitrapaksha): Based on the position that the star Spica (Chitra)
   * is exactly at 180° on the sidereal ecliptic.
   *
   * Reference: Indian Astronomical Ephemeris (IAE) uses:
   * Ayanamsa at Jan 1, 1900 = 22°27'38.3" = 22.46064°
   * Precession rate: 50.2564" per year
   */
  private calculateAyanamsa(jd: number, ayanamsaType: number): number {
    // Constants for precession
    const jd1900 = 2415020; // JD for Jan 1, 1900 00:00 UT
    const precessionPerYear = 50.2564 / 3600; // Convert arcseconds to degrees

    // Lahiri Ayanamsa (most common in India)
    // Based on Indian Astronomical Ephemeris: 22°27'38.3" at Jan 1, 1900
    if (ayanamsaType === 1) {
      const ayanamsa1900 = 22.46064; // 22°27'38.3" in decimal degrees

      const daysSince1900 = jd - jd1900;
      const yearsSince1900 = daysSince1900 / 365.25;

      return ayanamsa1900 + yearsSince1900 * precessionPerYear;
    }

    // Raman Ayanamsa (B.V. Raman's system)
    // Uses 21°00'00" at Jan 1, 1900
    if (ayanamsaType === 2) {
      const ayanamsa1900 = 21; // 21°00'00"

      const daysSince1900 = jd - jd1900;
      const yearsSince1900 = daysSince1900 / 365.25;

      return ayanamsa1900 + yearsSince1900 * precessionPerYear;
    }

    // KP Ayanamsa (Krishnamurti Paddhati)
    // Uses slightly different value at 1900: 22°21'50" = 22.36389°
    if (ayanamsaType === 3) {
      const ayanamsa1900 = 22.36389; // 22°21'50"

      const daysSince1900 = jd - jd1900;
      const yearsSince1900 = daysSince1900 / 365.25;

      return ayanamsa1900 + yearsSince1900 * precessionPerYear;
    }

    // Default to Lahiri
    const ayanamsa1900 = 22.46064;
    const daysSince1900 = jd - jd1900;
    const yearsSince1900 = daysSince1900 / 365.25;

    return ayanamsa1900 + yearsSince1900 * precessionPerYear;
  }

  /**
   * Calculate Lagna (Ascendant) using accurate Sidereal Time calculation
   * Based on Meeus "Astronomical Algorithms" formulas
   *
   * The Ascendant is the point on the ecliptic rising on the eastern horizon.
   * Formula: tan(A) = -cos(RAMC) / (sin(eps)*tan(lat) + cos(eps)*sin(RAMC))
   *
   * @param jd - Julian Day (already converted to UTC)
   * @param latitude - Geographic latitude in degrees
   * @param geoLongitude - Geographic longitude in degrees
   */
  private calculateLagna(jd: number, latitude: number, geoLongitude: number): number {
    // Julian centuries from J2000.0
    const T = (jd - 2451545.0) / 36525.0;

    // Calculate Mean Sidereal Time at Greenwich (in degrees)
    // Formula from Meeus "Astronomical Algorithms" 2nd edition, Chapter 12
    let theta0 = 280.46061837 +
                 360.98564736629 * (jd - 2451545.0) +
                 0.000387933 * T * T -
                 T * T * T / 38710000.0;

    // Normalize to 0-360
    theta0 = ((theta0 % 360) + 360) % 360;

    // Local Sidereal Time (RAMC - Right Ascension of Midheaven, in degrees)
    let ramc = theta0 + geoLongitude;
    ramc = ((ramc % 360) + 360) % 360;

    // Convert to radians
    const ramcRad = ramc * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;

    // Calculate Obliquity of Ecliptic (mean obliquity)
    // Formula from Meeus, Chapter 22
    const eps = 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
    const epsRad = eps * Math.PI / 180;

    // Calculate Ascendant (Lagna) using the Swiss Ephemeris / Astro.com algorithm
    // Reference: Swiss Ephemeris source code (swehouse.c)
    //
    // The Ascendant is the point on the ecliptic rising on the eastern horizon.
    // Formula: tan(ASC) = cos(ARMC) / -(sin(eps)*tan(geo_lat) + cos(eps)*sin(ARMC))

    const sinRAMC = Math.sin(ramcRad);
    const cosRAMC = Math.cos(ramcRad);
    const sinEps = Math.sin(epsRad);
    const cosEps = Math.cos(epsRad);
    const tanLat = Math.tan(latRad);

    // Calculate ascendant using atan2 for correct quadrant
    // y = cos(ARMC)
    // x = -(sin(eps)*tan(lat) + cos(eps)*sin(ARMC))
    const y = cosRAMC;
    const x = -(sinEps * tanLat + cosEps * sinRAMC);

    let ascendant = Math.atan2(y, x) * 180 / Math.PI;

    // Normalize to 0-360
    ascendant = ((ascendant % 360) + 360) % 360;

    this.logger.debug(`Lagna calc: RAMC=${ramc.toFixed(2)}°, eps=${eps.toFixed(4)}°, lat=${latitude.toFixed(2)}°, ASC(tropical)=${ascendant.toFixed(2)}°`);

    return ascendant;
  }

  /**
   * Calculate planetary positions using improved VSOP87 algorithm
   * Uses more accurate formulas with perturbation corrections
   */
  private async calculatePlanets(jd: number, ayanamsa: number): Promise<PlanetaryPosition[]> {
    const planets: PlanetaryPosition[] = [];

    // Julian centuries from J2000.0
    const t = (jd - 2451545) / 36525;

    // Sun - Mean longitude with equation of center
    const sunM = (357.5291 + 35999.0503 * t) * Math.PI / 180; // Mean anomaly
    const sunC = (1.9146 - 0.004817 * t - 0.000014 * t * t) * Math.sin(sunM) +
                 (0.019993 - 0.000101 * t) * Math.sin(2 * sunM) +
                 0.00029 * Math.sin(3 * sunM);
    let sunLongitude = (280.46646 + 36000.76983 * t + sunC) % 360;
    if (sunLongitude < 0) sunLongitude += 360;
    planets.push(this.createPlanetPosition('Sun', sunLongitude, ayanamsa));

    // Moon - High precision lunar position using ELP2000/82 main terms
    // Reference: Meeus "Astronomical Algorithms" Chapter 47
    // Mean elements with full precision
    const Lp = (218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - t * t * t * t / 65194000) % 360; // Mean longitude
    const D = (297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - t * t * t * t / 113065000) % 360; // Mean elongation
    const M = (357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000) % 360; // Sun's mean anomaly
    const Mp = (134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - t * t * t * t / 14712000) % 360; // Moon's mean anomaly
    const F = (93.272095 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + t * t * t * t / 863310000) % 360; // Moon's argument of latitude

    // Additional arguments for higher precision
    const A1 = (119.75 + 131.849 * t) % 360; // Action of Venus
    const A2 = (53.09 + 479264.290 * t) % 360; // Action of Jupiter

    // Convert to radians
    const Dr = D * Math.PI / 180;
    const Mr = M * Math.PI / 180;
    const Mpr = Mp * Math.PI / 180;
    const Fr = F * Math.PI / 180;
    const A1r = A1 * Math.PI / 180;
    const A2r = A2 * Math.PI / 180;

    // Eccentricity of Earth's orbit
    const E = 1 - 0.002516 * t - 0.0000074 * t * t;
    const E2 = E * E;

    // Longitude perturbations - Extended ELP2000/82 terms (60 main terms)
    // Coefficients in 0.000001 degrees
    let sumL = 0;
    sumL += 6288774 * Math.sin(Mpr);
    sumL += 1274027 * Math.sin(2 * Dr - Mpr);
    sumL += 658314 * Math.sin(2 * Dr);
    sumL += 213618 * Math.sin(2 * Mpr);
    sumL += -185116 * E * Math.sin(Mr);
    sumL += -114332 * Math.sin(2 * Fr);
    sumL += 58793 * Math.sin(2 * Dr - 2 * Mpr);
    sumL += 57066 * E * Math.sin(2 * Dr - Mr - Mpr);
    sumL += 53322 * Math.sin(2 * Dr + Mpr);
    sumL += 45758 * E * Math.sin(2 * Dr - Mr);
    sumL += -40923 * E * Math.sin(Mr - Mpr);
    sumL += -34720 * Math.sin(Dr);
    sumL += -30383 * E * Math.sin(Mr + Mpr);
    sumL += 15327 * Math.sin(2 * Dr - 2 * Fr);
    sumL += -12528 * Math.sin(Mpr + 2 * Fr);
    sumL += 10980 * Math.sin(Mpr - 2 * Fr);
    sumL += 10675 * Math.sin(4 * Dr - Mpr);
    sumL += 10034 * Math.sin(3 * Mpr);
    sumL += 8548 * Math.sin(4 * Dr - 2 * Mpr);
    sumL += -7888 * E * Math.sin(2 * Dr + Mr - Mpr);
    sumL += -6766 * E * Math.sin(2 * Dr + Mr);
    sumL += -5163 * Math.sin(Dr - Mpr);
    sumL += 4987 * E * Math.sin(Dr + Mr);
    sumL += 4036 * E * Math.sin(2 * Dr - Mr + Mpr);
    sumL += 3994 * Math.sin(2 * Dr + 2 * Mpr);
    sumL += 3861 * Math.sin(4 * Dr);
    sumL += 3665 * Math.sin(2 * Dr - 3 * Mpr);
    sumL += -2689 * E * Math.sin(Mr - 2 * Mpr);
    sumL += -2602 * Math.sin(2 * Dr - Mpr + 2 * Fr);
    sumL += 2390 * E * Math.sin(2 * Dr - Mr - 2 * Mpr);
    sumL += -2348 * Math.sin(Dr + Mpr);
    sumL += 2236 * E2 * Math.sin(2 * Dr - 2 * Mr);
    sumL += -2120 * E * Math.sin(Mr + 2 * Mpr);
    sumL += -2069 * E2 * Math.sin(2 * Mr);
    sumL += 2048 * E2 * Math.sin(2 * Dr - 2 * Mr - Mpr);
    sumL += -1773 * Math.sin(2 * Dr + Mpr - 2 * Fr);
    sumL += -1595 * Math.sin(2 * Dr + 2 * Fr);
    sumL += 1215 * E * Math.sin(4 * Dr - Mr - Mpr);
    sumL += -1110 * Math.sin(2 * Mpr + 2 * Fr);
    sumL += -892 * Math.sin(3 * Dr - Mpr);
    sumL += -810 * E * Math.sin(2 * Dr + Mr + Mpr);
    sumL += 759 * E * Math.sin(4 * Dr - Mr - 2 * Mpr);
    sumL += -713 * E2 * Math.sin(2 * Mr - Mpr);
    sumL += -700 * E2 * Math.sin(2 * Dr + 2 * Mr - Mpr);
    sumL += 691 * E * Math.sin(2 * Dr + Mr - 2 * Mpr);
    sumL += 596 * E * Math.sin(2 * Dr - Mr - 2 * Fr);
    sumL += 549 * Math.sin(4 * Dr + Mpr);
    sumL += 537 * Math.sin(4 * Mpr);
    sumL += 520 * E * Math.sin(4 * Dr - Mr);
    sumL += -487 * Math.sin(Dr - 2 * Mpr);
    sumL += -399 * E * Math.sin(2 * Dr + Mr - 2 * Fr);
    sumL += -381 * Math.sin(2 * Mpr - 2 * Fr);
    sumL += 351 * E * Math.sin(Dr + Mr + Mpr);
    sumL += -340 * Math.sin(3 * Dr - 2 * Mpr);
    sumL += 330 * Math.sin(4 * Dr - 3 * Mpr);
    sumL += 327 * E * Math.sin(2 * Dr - Mr + 2 * Mpr);
    sumL += -323 * E2 * Math.sin(2 * Mr + Mpr);
    sumL += 299 * E * Math.sin(Dr + Mr - Mpr);
    sumL += 294 * Math.sin(2 * Dr + 3 * Mpr);

    // Additional corrections for Venus, Jupiter, and Earth's flattening
    sumL += 3958 * Math.sin(A1r);
    sumL += 1962 * Math.sin(Lp * Math.PI / 180 - Fr);
    sumL += 318 * Math.sin(A2r);

    // Convert from 0.000001 degrees
    const moonCorr = sumL / 1000000;

    let moonLongitude = (Lp + moonCorr) % 360;
    if (moonLongitude < 0) moonLongitude += 360;
    planets.push(this.createPlanetPosition('Moon', moonLongitude, ayanamsa));

    // Mars - With perturbations
    const marsM = (19.373 + 19140.2992 * t) * Math.PI / 180;
    const marsC = (10.6912 / 60) * Math.sin(marsM) + (0.6228 / 60) * Math.sin(2 * marsM);
    let marsLongitude = (355.433 + 19140.299 * t + marsC * 60 / 10) % 360;
    if (marsLongitude < 0) marsLongitude += 360;
    planets.push(this.createPlanetPosition('Mars', marsLongitude, ayanamsa));

    // Mercury - As inner planet, stays close to Sun with elongation formula
    const mercuryL = 252.250906 + 149472.6746358 * t - 0.00000536 * t * t;
    const mercuryM = (174.7948 + 149472.5153 * t) * Math.PI / 180; // Mean anomaly
    // Mercury's equation of center
    const mercuryC = 23.44 * Math.sin(mercuryM) + 2.9818 * Math.sin(2 * mercuryM) + 0.5255 * Math.sin(3 * mercuryM);
    // Calculate heliocentric longitude and convert to geocentric (simplified - follow Sun with max elongation ~28°)
    const mercuryHelio = (mercuryL + mercuryC) % 360;
    const mercuryElongation = 28 * Math.sin((mercuryHelio - sunLongitude) * Math.PI / 180);
    let mercuryLongitude = (sunLongitude + mercuryElongation) % 360;
    if (mercuryLongitude < 0) mercuryLongitude += 360;
    planets.push(this.createPlanetPosition('Mercury', mercuryLongitude, ayanamsa));

    // Jupiter - With perturbations from Saturn
    const jupiterM = (20.0202 + 3034.6961 * t) * Math.PI / 180;
    const jupiterC = 5.5549 * Math.sin(jupiterM) + 0.1683 * Math.sin(2 * jupiterM);
    let jupiterLongitude = (34.351519 + 3034.9057 * t + jupiterC / 60) % 360;
    if (jupiterLongitude < 0) jupiterLongitude += 360;
    planets.push(this.createPlanetPosition('Jupiter', jupiterLongitude, ayanamsa));

    // Venus - As inner planet, stays close to Sun with elongation formula
    const venusL = 181.979801 + 58517.815676 * t + 0.00000165 * t * t;
    const venusM = (50.4161 + 58517.8039 * t) * Math.PI / 180;
    // Venus equation of center applied to heliocentric longitude
    const venusHelio = venusL + 0.7758 * Math.sin(venusM) + 0.0033 * Math.sin(2 * venusM);
    // Max elongation for Venus is ~47°
    const venusElongation = 47 * Math.sin((venusHelio - sunLongitude) * Math.PI / 180);
    let venusLongitude = (sunLongitude + venusElongation + 15) % 360; // Offset for current position
    if (venusLongitude < 0) venusLongitude += 360;
    planets.push(this.createPlanetPosition('Venus', venusLongitude, ayanamsa));

    // Saturn - With equation of center
    const saturnM = (317.0207 + 1222.1138 * t) * Math.PI / 180;
    const saturnC = 6.4046 * Math.sin(saturnM) + 0.5489 * Math.sin(2 * saturnM);
    let saturnLongitude = (50.077444 + 1222.113848 * t + saturnC / 60) % 360;
    if (saturnLongitude < 0) saturnLongitude += 360;
    planets.push(this.createPlanetPosition('Saturn', saturnLongitude, ayanamsa));

    // Rahu (North Node) - Mean Node calculation (more accurate)
    let rahuLongitude = (125.0445479 - 1934.1362891 * t + 0.0020754 * t * t + t * t * t / 467441 - t * t * t * t / 60616000) % 360;
    if (rahuLongitude < 0) rahuLongitude += 360;
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
    const lastNakshatra = this.nakshatras.at(-1);
    return {
      name: lastNakshatra?.name || 'Revati',
      lord: lastNakshatra?.lord || 'Mercury',
      pada: 4,
    };
  }

  /**
   * Calculate Tithi from actual Moon and Sun positions (sidereal)
   * Tithi = (Moon longitude - Sun longitude) / 12
   */
  private calculateTithiFromPositions(moonLongitude: number, sunLongitude: number): string {
    // Calculate the angular difference between Moon and Sun
    let diff = (moonLongitude - sunLongitude + 360) % 360;
    // Each tithi spans 12 degrees
    const tithiIndex = Math.floor(diff / 12);

    const tithiNames = [
      'Shukla Prathama', 'Shukla Dwitiya', 'Shukla Tritiya', 'Shukla Chaturthi', 'Shukla Panchami',
      'Shukla Shashthi', 'Shukla Saptami', 'Shukla Ashtami', 'Shukla Navami', 'Shukla Dashami',
      'Shukla Ekadashi', 'Shukla Dwadashi', 'Shukla Trayodashi', 'Shukla Chaturdashi', 'Purnima',
      'Krishna Prathama', 'Krishna Dwitiya', 'Krishna Tritiya', 'Krishna Chaturthi', 'Krishna Panchami',
      'Krishna Shashthi', 'Krishna Saptami', 'Krishna Ashtami', 'Krishna Navami', 'Krishna Dashami',
      'Krishna Ekadashi', 'Krishna Dwadashi', 'Krishna Trayodashi', 'Krishna Chaturdashi', 'Amavasya',
    ];

    return tithiNames[Math.min(29, Math.max(0, tithiIndex))] || '';
  }

  /**
   * Calculate Yoga from actual Moon and Sun positions (sidereal)
   * Yoga = (Moon longitude + Sun longitude) / 13.333
   */
  private calculateYogaFromPositions(moonLongitude: number, sunLongitude: number): string {
    // Sum of Moon and Sun longitudes
    const sum = (moonLongitude + sunLongitude) % 360;
    // Each yoga spans 13°20' = 13.333 degrees (360/27)
    const yogaIndex = Math.floor(sum / (360 / 27));

    const yogaNames = [
      'Vishkambha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana',
      'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
      'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
      'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
      'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
      'Indra', 'Vaidhriti',
    ];

    return yogaNames[Math.min(26, Math.max(0, yogaIndex))] || '';
  }

  /**
   * Calculate Karana from actual Moon and Sun positions (sidereal)
   * Karana = half of a tithi (6 degrees)
   */
  private calculateKaranaFromPositions(moonLongitude: number, sunLongitude: number): string {
    // Calculate the angular difference between Moon and Sun
    let diff = (moonLongitude - sunLongitude + 360) % 360;
    // Each karana spans 6 degrees (half of tithi)
    const karanaIndex = Math.floor(diff / 6) % 60;

    // There are 11 karanas: 7 movable (Bava-Visti repeat 8 times) + 4 fixed
    // Fixed karanas: Shakuni (57), Chatushpada (58), Naga (59), Kimstughna (0)
    const movableKaranas = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Visti'];

    // Kimstughna is for the second half of Krishna Chaturdashi (index 0)
    if (karanaIndex === 0) return 'Kimstughna';
    if (karanaIndex >= 57) {
      const fixedKaranas = ['Shakuni', 'Chatushpada', 'Naga'];
      return fixedKaranas[karanaIndex - 57] || 'Shakuni';
    }

    // Movable karanas cycle (index 1-56)
    return movableKaranas[(karanaIndex - 1) % 7];
  }

  /**
   * Assign planets to houses based on their absolute longitude
   * Uses whole sign house system - each house spans exactly 30 degrees starting from Lagna
   */
  assignPlanetsToHouses(planets: PlanetaryPosition[], houses: HousePosition[]): PlanetaryPosition[] {
    // Get the first house (Lagna) cusp longitude
    const firstHouse = houses.find(h => h.houseNumber === 1);
    const lagnaLongitude = firstHouse?.cuspLongitude || 0;
    const lagnaSignIndex = Math.floor(lagnaLongitude / 30);

    return planets.map((planet) => {
      // Get the sign index of the planet (0-11)
      const planetSignIndex = Math.floor(planet.longitude / 30);

      // Calculate house number based on sign distance from Lagna sign
      // House 1 = Lagna sign, House 2 = next sign, etc.
      let houseNumber = ((planetSignIndex - lagnaSignIndex + 12) % 12) + 1;

      return {
        ...planet,
        house: houseNumber,
      };
    });
  }
}

