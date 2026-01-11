"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SwissEphemerisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwissEphemerisService = void 0;
const common_1 = require("@nestjs/common");
let SwissEphemerisService = SwissEphemerisService_1 = class SwissEphemerisService {
    constructor() {
        this.logger = new common_1.Logger(SwissEphemerisService_1.name);
        this.signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
        ];
        this.signLords = {
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
        this.nakshatras = [
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
    }
    async calculateKundli(params) {
        const { datetime, latitude, longitude, timezone, ayanamsa = 1 } = params;
        const tzOffset = this.getTimezoneOffset(timezone);
        const jd = this.toJulianDayFromLocal(datetime, tzOffset);
        this.logger.log(`Calculating Kundli: Date=${datetime.toISOString()}, TZ=${timezone}, Offset=${tzOffset}h, JD=${jd.toFixed(6)}`);
        this.logger.log(`Location: Lat=${latitude}°, Lon=${longitude}°`);
        const calculatedAyanamsa = this.calculateAyanamsa(jd, ayanamsa);
        this.logger.log(`Ayanamsa (Lahiri): ${calculatedAyanamsa.toFixed(4)}°`);
        const tropicalLagna = this.calculateLagna(jd, latitude, longitude);
        this.logger.log(`Tropical Lagna: ${tropicalLagna.toFixed(4)}°`);
        const siderealLagna = (tropicalLagna - calculatedAyanamsa + 360) % 360;
        const lagnaSign = this.getSignFromLongitude(siderealLagna);
        const lagnaDegrees = siderealLagna % 30;
        this.logger.log(`Sidereal Lagna: ${siderealLagna.toFixed(4)}° = ${lagnaSign} ${lagnaDegrees.toFixed(2)}°`);
        const planets = await this.calculatePlanets(jd, calculatedAyanamsa);
        const houses = this.calculateHouses(siderealLagna);
        const moon = planets.find((p) => p.name === 'Moon');
        const nakshatra = moon
            ? this.getNakshatraFromLongitude(moon.longitude)
            : { name: '', lord: '', pada: 1 };
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
    toJulianDay(date) {
        const time = date.getTime();
        return time / 86400000 + 2440587.5;
    }
    getTimezoneOffset(timezone) {
        const timezoneOffsets = {
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
        if (timezoneOffsets[timezone] !== undefined) {
            return timezoneOffsets[timezone];
        }
        const numericMatch = timezone.match(/^([+-]?)(\d{1,2}):?(\d{2})?$/);
        if (numericMatch) {
            const sign = numericMatch[1] === '-' ? -1 : 1;
            const hours = parseInt(numericMatch[2], 10);
            const minutes = parseInt(numericMatch[3] || '0', 10);
            return sign * (hours + minutes / 60);
        }
        this.logger.warn(`Unknown timezone: ${timezone}, defaulting to IST (UTC+5:30)`);
        return 5.5;
    }
    toJulianDayFromLocal(inputDate, userTzOffset) {
        const serverTzOffsetMinutes = inputDate.getTimezoneOffset();
        const serverTzOffsetHours = -serverTzOffsetMinutes / 60;
        const tzAdjustmentHours = serverTzOffsetHours - userTzOffset;
        const utcMillis = inputDate.getTime();
        const adjustedMillis = utcMillis + (tzAdjustmentHours * 3600 * 1000);
        const adjustedDate = new Date(adjustedMillis);
        const year = adjustedDate.getUTCFullYear();
        const month = adjustedDate.getUTCMonth() + 1;
        const day = adjustedDate.getUTCDate();
        const hour = adjustedDate.getUTCHours();
        const minute = adjustedDate.getUTCMinutes();
        const second = adjustedDate.getUTCSeconds();
        const decimalHours = hour + minute / 60 + second / 3600;
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
    calculateAyanamsa(jd, ayanamsaType) {
        const jd1900 = 2415020;
        const precessionPerYear = 50.2564 / 3600;
        if (ayanamsaType === 1) {
            const ayanamsa1900 = 22.46064;
            const daysSince1900 = jd - jd1900;
            const yearsSince1900 = daysSince1900 / 365.25;
            return ayanamsa1900 + yearsSince1900 * precessionPerYear;
        }
        if (ayanamsaType === 2) {
            const ayanamsa1900 = 21;
            const daysSince1900 = jd - jd1900;
            const yearsSince1900 = daysSince1900 / 365.25;
            return ayanamsa1900 + yearsSince1900 * precessionPerYear;
        }
        if (ayanamsaType === 3) {
            const ayanamsa1900 = 22.36389;
            const daysSince1900 = jd - jd1900;
            const yearsSince1900 = daysSince1900 / 365.25;
            return ayanamsa1900 + yearsSince1900 * precessionPerYear;
        }
        const ayanamsa1900 = 22.46064;
        const daysSince1900 = jd - jd1900;
        const yearsSince1900 = daysSince1900 / 365.25;
        return ayanamsa1900 + yearsSince1900 * precessionPerYear;
    }
    calculateLagna(jd, latitude, geoLongitude) {
        const T = (jd - 2451545.0) / 36525.0;
        let theta0 = 280.46061837 +
            360.98564736629 * (jd - 2451545.0) +
            0.000387933 * T * T -
            T * T * T / 38710000.0;
        theta0 = ((theta0 % 360) + 360) % 360;
        let ramc = theta0 + geoLongitude;
        ramc = ((ramc % 360) + 360) % 360;
        const ramcRad = ramc * Math.PI / 180;
        const latRad = latitude * Math.PI / 180;
        const eps = 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
        const epsRad = eps * Math.PI / 180;
        const sinRAMC = Math.sin(ramcRad);
        const cosRAMC = Math.cos(ramcRad);
        const sinEps = Math.sin(epsRad);
        const cosEps = Math.cos(epsRad);
        const tanLat = Math.tan(latRad);
        const y = cosRAMC;
        const x = -(sinEps * tanLat + cosEps * sinRAMC);
        let ascendant = Math.atan2(y, x) * 180 / Math.PI;
        ascendant = ((ascendant % 360) + 360) % 360;
        this.logger.debug(`Lagna calc: RAMC=${ramc.toFixed(2)}°, eps=${eps.toFixed(4)}°, lat=${latitude.toFixed(2)}°, ASC(tropical)=${ascendant.toFixed(2)}°`);
        return ascendant;
    }
    async calculatePlanets(jd, ayanamsa) {
        const planets = [];
        const t = (jd - 2451545) / 36525;
        const sunM = (357.5291 + 35999.0503 * t) * Math.PI / 180;
        const sunC = (1.9146 - 0.004817 * t - 0.000014 * t * t) * Math.sin(sunM) +
            (0.019993 - 0.000101 * t) * Math.sin(2 * sunM) +
            0.00029 * Math.sin(3 * sunM);
        let sunLongitude = (280.46646 + 36000.76983 * t + sunC) % 360;
        if (sunLongitude < 0)
            sunLongitude += 360;
        planets.push(this.createPlanetPosition('Sun', sunLongitude, ayanamsa));
        const Lp = (218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - t * t * t * t / 65194000) % 360;
        const D = (297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - t * t * t * t / 113065000) % 360;
        const M = (357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000) % 360;
        const Mp = (134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - t * t * t * t / 14712000) % 360;
        const F = (93.272095 + 483202.0175233 * t - 0.0036539 * t * t - t * t * t / 3526000 + t * t * t * t / 863310000) % 360;
        const A1 = (119.75 + 131.849 * t) % 360;
        const A2 = (53.09 + 479264.290 * t) % 360;
        const Dr = D * Math.PI / 180;
        const Mr = M * Math.PI / 180;
        const Mpr = Mp * Math.PI / 180;
        const Fr = F * Math.PI / 180;
        const A1r = A1 * Math.PI / 180;
        const A2r = A2 * Math.PI / 180;
        const E = 1 - 0.002516 * t - 0.0000074 * t * t;
        const E2 = E * E;
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
        sumL += 3958 * Math.sin(A1r);
        sumL += 1962 * Math.sin(Lp * Math.PI / 180 - Fr);
        sumL += 318 * Math.sin(A2r);
        const moonCorr = sumL / 1000000;
        let moonLongitude = (Lp + moonCorr) % 360;
        if (moonLongitude < 0)
            moonLongitude += 360;
        planets.push(this.createPlanetPosition('Moon', moonLongitude, ayanamsa));
        const marsM = (19.373 + 19140.2992 * t) * Math.PI / 180;
        const marsC = (10.6912 / 60) * Math.sin(marsM) + (0.6228 / 60) * Math.sin(2 * marsM);
        let marsLongitude = (355.433 + 19140.299 * t + marsC * 60 / 10) % 360;
        if (marsLongitude < 0)
            marsLongitude += 360;
        planets.push(this.createPlanetPosition('Mars', marsLongitude, ayanamsa));
        const mercuryL = 252.250906 + 149472.6746358 * t - 0.00000536 * t * t;
        const mercuryM = (174.7948 + 149472.5153 * t) * Math.PI / 180;
        const mercuryC = 23.44 * Math.sin(mercuryM) + 2.9818 * Math.sin(2 * mercuryM) + 0.5255 * Math.sin(3 * mercuryM);
        const mercuryHelio = (mercuryL + mercuryC) % 360;
        const mercuryElongation = 28 * Math.sin((mercuryHelio - sunLongitude) * Math.PI / 180);
        let mercuryLongitude = (sunLongitude + mercuryElongation) % 360;
        if (mercuryLongitude < 0)
            mercuryLongitude += 360;
        planets.push(this.createPlanetPosition('Mercury', mercuryLongitude, ayanamsa));
        const jupiterM = (20.0202 + 3034.6961 * t) * Math.PI / 180;
        const jupiterC = 5.5549 * Math.sin(jupiterM) + 0.1683 * Math.sin(2 * jupiterM);
        let jupiterLongitude = (34.351519 + 3034.9057 * t + jupiterC / 60) % 360;
        if (jupiterLongitude < 0)
            jupiterLongitude += 360;
        planets.push(this.createPlanetPosition('Jupiter', jupiterLongitude, ayanamsa));
        const venusL = 181.979801 + 58517.815676 * t + 0.00000165 * t * t;
        const venusM = (50.4161 + 58517.8039 * t) * Math.PI / 180;
        const venusHelio = venusL + 0.7758 * Math.sin(venusM) + 0.0033 * Math.sin(2 * venusM);
        const venusElongation = 47 * Math.sin((venusHelio - sunLongitude) * Math.PI / 180);
        let venusLongitude = (sunLongitude + venusElongation + 15) % 360;
        if (venusLongitude < 0)
            venusLongitude += 360;
        planets.push(this.createPlanetPosition('Venus', venusLongitude, ayanamsa));
        const saturnM = (317.0207 + 1222.1138 * t) * Math.PI / 180;
        const saturnC = 6.4046 * Math.sin(saturnM) + 0.5489 * Math.sin(2 * saturnM);
        let saturnLongitude = (50.077444 + 1222.113848 * t + saturnC / 60) % 360;
        if (saturnLongitude < 0)
            saturnLongitude += 360;
        planets.push(this.createPlanetPosition('Saturn', saturnLongitude, ayanamsa));
        let rahuLongitude = (125.0445479 - 1934.1362891 * t + 0.0020754 * t * t + t * t * t / 467441 - t * t * t * t / 60616000) % 360;
        if (rahuLongitude < 0)
            rahuLongitude += 360;
        planets.push(this.createPlanetPosition('Rahu', rahuLongitude, ayanamsa));
        const ketuLongitude = (rahuLongitude + 180) % 360;
        planets.push(this.createPlanetPosition('Ketu', ketuLongitude, ayanamsa));
        return planets;
    }
    createPlanetPosition(name, longitude, ayanamsa) {
        const siderealLongitude = (longitude - ayanamsa + 360) % 360;
        const sign = this.getSignFromLongitude(siderealLongitude);
        const nakshatra = this.getNakshatraFromLongitude(siderealLongitude);
        return {
            name,
            longitude: siderealLongitude,
            latitude: 0,
            distance: 0,
            speed: 0,
            isRetrograde: false,
            sign,
            signLord: this.signLords[sign] || '',
            nakshatra: nakshatra.name,
            nakshatraLord: nakshatra.lord,
            nakshatraPada: nakshatra.pada,
            house: 0,
        };
    }
    calculateHouses(lagnaLongitude) {
        const houses = [];
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
    getSignFromLongitude(longitude) {
        const signIndex = Math.floor(longitude / 30);
        return this.signs[signIndex % 12];
    }
    getNakshatraFromLongitude(longitude) {
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
        const lastNakshatra = this.nakshatras.at(-1);
        return {
            name: lastNakshatra?.name || 'Revati',
            lord: lastNakshatra?.lord || 'Mercury',
            pada: 4,
        };
    }
    calculateTithiFromPositions(moonLongitude, sunLongitude) {
        let diff = (moonLongitude - sunLongitude + 360) % 360;
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
    calculateYogaFromPositions(moonLongitude, sunLongitude) {
        const sum = (moonLongitude + sunLongitude) % 360;
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
    calculateKaranaFromPositions(moonLongitude, sunLongitude) {
        let diff = (moonLongitude - sunLongitude + 360) % 360;
        const karanaIndex = Math.floor(diff / 6) % 60;
        const movableKaranas = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Visti'];
        if (karanaIndex === 0)
            return 'Kimstughna';
        if (karanaIndex >= 57) {
            const fixedKaranas = ['Shakuni', 'Chatushpada', 'Naga'];
            return fixedKaranas[karanaIndex - 57] || 'Shakuni';
        }
        return movableKaranas[(karanaIndex - 1) % 7];
    }
    assignPlanetsToHouses(planets, houses) {
        const firstHouse = houses.find(h => h.houseNumber === 1);
        const lagnaLongitude = firstHouse?.cuspLongitude || 0;
        const lagnaSignIndex = Math.floor(lagnaLongitude / 30);
        return planets.map((planet) => {
            const planetSignIndex = Math.floor(planet.longitude / 30);
            let houseNumber = ((planetSignIndex - lagnaSignIndex + 12) % 12) + 1;
            return {
                ...planet,
                house: houseNumber,
            };
        });
    }
};
exports.SwissEphemerisService = SwissEphemerisService;
exports.SwissEphemerisService = SwissEphemerisService = SwissEphemerisService_1 = __decorate([
    (0, common_1.Injectable)()
], SwissEphemerisService);
//# sourceMappingURL=swiss-ephemeris.service.js.map