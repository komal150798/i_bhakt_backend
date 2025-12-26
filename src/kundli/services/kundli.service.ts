import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { Kundli } from '../entities/kundli.entity';
import { KundliPlanet } from '../entities/kundli-planet.entity';
import { KundliHouse } from '../entities/kundli-house.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject('IKundliRepository')
    private readonly kundliRepository: IKundliRepository,
    @InjectRepository(KundliPlanet)
    private readonly kundliPlanetRepository: Repository<KundliPlanet>,
    @InjectRepository(KundliHouse)
    private readonly kundliHouseRepository: Repository<KundliHouse>,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  /**
   * Generate kundli using Swiss Ephemeris
   */
  async generateKundli(dto: GenerateKundliDto, userId?: number): Promise<KundliResponseDto> {
    try {
      // Parse birth date and time
      const birthDateTime = new Date(`${dto.birth_date}T${dto.birth_time}`);
      
      // Get coordinates if not provided
      let { latitude, longitude, timezone } = dto;
      if (!latitude || !longitude) {
        const coords = await this.getCoordinatesFromPlace(dto.birth_place);
        latitude = coords.latitude;
        longitude = coords.longitude;
        timezone = coords.timezone || 'Asia/Kolkata';
      }

      // Use Swiss Ephemeris for accurate calculations
      this.logger.log('Using Swiss Ephemeris for kundli calculation');
      const swissData = await this.swissEphemerisService.calculateKundli({
        datetime: birthDateTime,
        latitude,
        longitude,
        timezone: timezone || 'Asia/Kolkata',
        ayanamsa: dto.ayanamsa || 1, // 1 = Lahiri (default)
      });

      // Assign planets to houses
      const planetsWithHouses = this.swissEphemerisService.assignPlanetsToHouses(
        swissData.planets,
        swissData.houses,
      );

      // Transform Swiss Ephemeris data to our standard format
      const transformedData = this.transformSwissEphemerisResponse(swissData, dto, planetsWithHouses);

      // Save to database if user is authenticated
      if (userId) {
        await this.saveKundliToDatabase(userId, dto, transformedData, latitude, longitude, timezone);
      }

      return transformedData;
    } catch (error) {
      this.logger.error('Error generating kundli:', error);
      throw new BadRequestException(
        error.response?.data?.message || error.message || 'Failed to generate kundli',
      );
    }
  }


  /**
   * Transform Swiss Ephemeris data to standard format
   */
  private transformSwissEphemerisResponse(
    swissData: any,
    dto: GenerateKundliDto,
    planetsWithHouses: any[],
  ): KundliResponseDto {
    return {
      name: dto.name,
      birth_date: dto.birth_date,
      birth_time: dto.birth_time,
      birth_place: dto.birth_place,
      latitude: dto.latitude || 0,
      longitude: dto.longitude || 0,
      timezone: dto.timezone || 'Asia/Kolkata',
      lagna: {
        sign: swissData.lagna.sign,
        degrees: swissData.lagna.degrees,
        lord: swissData.lagna.signLord,
      },
      nakshatra: {
        name: swissData.nakshatra.name,
        pada: swissData.nakshatra.pada,
        lord: swissData.nakshatra.lord,
      },
      planets: planetsWithHouses.map((planet) => ({
        name: planet.name,
        longitude: planet.longitude,
        latitude: planet.latitude,
        sign: planet.sign,
        sign_lord: planet.signLord,
        nakshatra: planet.nakshatra,
        nakshatra_lord: planet.nakshatraLord,
        nakshatra_pada: planet.nakshatraPada,
        house: planet.house,
        is_retrograde: planet.isRetrograde,
      })),
      houses: swissData.houses.map((house: any) => ({
        house_number: house.houseNumber,
        sign: house.sign,
        sign_lord: house.signLord,
        start_degree: house.startDegree,
        end_degree: house.endDegree,
      })),
      ayanamsa: swissData.ayanamsa,
      tithi: swissData.tithi || '',
      yoga: swissData.yoga || '',
      karana: swissData.karana || '',
      full_data: swissData,
    };
  }


  /**
   * Get coordinates from place name (using free geocoding)
   */
  private async getCoordinatesFromPlace(place: string): Promise<{
    latitude: number;
    longitude: number;
    timezone?: string;
  }> {
    try {
      // Use free Nominatim API for geocoding
      const response = await firstValueFrom(
        this.httpService.get<Array<{ lat: string; lon: string }>>(`https://nominatim.openstreetmap.org/search`, {
          params: {
            q: place,
            format: 'json',
            limit: 1,
          },
          headers: {
            'User-Agent': 'I-Bhakt-Kundli-Service',
          },
        }),
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          timezone: 'Asia/Kolkata', // Default, can be improved
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to geocode place: ${place}`, error);
    }

    // Default to Mumbai if geocoding fails
    return {
      latitude: 19.0760,
      longitude: 72.8777,
      timezone: 'Asia/Kolkata',
    };
  }

  /**
   * Save kundli to database with all related data (planets, houses, dasha, navamsa)
   */
  private async saveKundliToDatabase(
    userId: number,
    dto: GenerateKundliDto,
    kundliData: KundliResponseDto,
    latitude: number,
    longitude: number,
    timezone: string,
  ): Promise<void> {
    try {
      // Calculate dasha timeline
      const birthDateTime = new Date(`${dto.birth_date}T${dto.birth_time}`);
      const dashaTimeline = this.calculateVimshottariDasha(
        birthDateTime,
        kundliData.nakshatra.name,
        kundliData.nakshatra.lord,
      );

      // Create navamsa data placeholder (can be enhanced later)
      const navamsaData = {
        d9_chart: {},
        marriage_strength: '',
      };

      // Create kundli record
      const savedKundli = await this.kundliRepository.create({
        user_id: userId,
        birth_date: new Date(dto.birth_date),
        birth_time: dto.birth_time,
        birth_place: dto.birth_place,
        latitude,
        longitude,
        timezone,
        lagna_degrees: kundliData.lagna.degrees,
        lagna_name: kundliData.lagna.sign,
        nakshatra: kundliData.nakshatra.name,
        pada: kundliData.nakshatra.pada,
        tithi: kundliData.tithi,
        yoga: kundliData.yoga,
        karana: kundliData.karana,
        ayanamsa: kundliData.ayanamsa,
        full_data: kundliData.full_data,
        dasha_timeline: dashaTimeline,
        navamsa_data: navamsaData,
      });

      // Save planets to kundli_planets table
      if (kundliData.planets && kundliData.planets.length > 0) {
        const planetsToSave = kundliData.planets.map((planet) => {
          const planetEntity = this.kundliPlanetRepository.create({
            kundli_id: savedKundli.id,
            planet_name: planet.name,
            longitude_degrees: planet.longitude,
            sign_number: this.getSignNumber(planet.sign),
            sign_name: planet.sign,
            house_number: planet.house || 0,
            nakshatra: planet.nakshatra || null,
            pada: planet.nakshatra_pada || null,
            is_retrograde: planet.is_retrograde || false,
            speed: null, // Can be calculated if needed
            metadata: {
              latitude: planet.latitude,
              sign_lord: planet.sign_lord,
              nakshatra_lord: planet.nakshatra_lord,
            },
          });
          return planetEntity;
        });

        await this.kundliPlanetRepository.save(planetsToSave);
        this.logger.log(`Saved ${planetsToSave.length} planets for kundli ${savedKundli.id}`);
      }

      // Save houses to kundli_houses table
      if (kundliData.houses && kundliData.houses.length > 0) {
        const housesToSave = kundliData.houses.map((house) => {
          const houseEntity = this.kundliHouseRepository.create({
            kundli_id: savedKundli.id,
            house_number: house.house_number,
            cusp_degrees: house.start_degree || 0,
            sign_name: house.sign,
            sign_number: this.getSignNumber(house.sign),
            metadata: {
              sign_lord: house.sign_lord,
              end_degree: house.end_degree,
            },
          });
          return houseEntity;
        });

        await this.kundliHouseRepository.save(housesToSave);
        this.logger.log(`Saved ${housesToSave.length} houses for kundli ${savedKundli.id}`);
      }

      this.logger.log(`Kundli saved for user ${userId} with all related data`);
    } catch (error) {
      this.logger.error('Failed to save kundli to database:', error);
      // Don't throw - kundli generation succeeded even if save failed
    }
  }

  /**
   * Get sign number from sign name (1-12)
   */
  private getSignNumber(signName: string): number {
    const signs: Record<string, number> = {
      Aries: 1,
      Taurus: 2,
      Gemini: 3,
      Cancer: 4,
      Leo: 5,
      Virgo: 6,
      Libra: 7,
      Scorpio: 8,
      Sagittarius: 9,
      Capricorn: 10,
      Aquarius: 11,
      Pisces: 12,
    };
    return signs[signName] || 0;
  }

  // Helper methods for fallback calculation
  private toJulianDay(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
  }

  private calculateLagna(date: Date, latitude: number, longitude: number): number {
    // Simplified lagna calculation - use proper library in production
    const hours = date.getHours() + date.getMinutes() / 60;
    const localSiderealTime = this.calculateLST(date, longitude);
    const lagna = (localSiderealTime * 15) % 360;
    return lagna;
  }

  private calculateLST(date: Date, longitude: number): number {
    // Simplified LST calculation
    const hours = date.getHours() + date.getMinutes() / 60;
    const daysSinceJ2000 = (date.getTime() - new Date('2000-01-01').getTime()) / 86400000;
    const gmst = 18.697374558 + 24.06570982441908 * daysSinceJ2000;
    const lst = (gmst + longitude / 15) % 24;
    return lst;
  }

  private getSignFromLongitude(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];
    const signIndex = Math.floor(longitude / 30);
    return signs[signIndex % 12];
  }

  private getSignLord(sign: string): string {
    const lords: Record<string, string> = {
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
    return lords[sign] || '';
  }

  private calculatePlanets(date: Date): any[] {
    // Simplified - use proper ephemeris in production
    return [
      { name: 'Sun', longitude: 0 },
      { name: 'Moon', longitude: 0 },
      { name: 'Mars', longitude: 0 },
      { name: 'Mercury', longitude: 0 },
      { name: 'Jupiter', longitude: 0 },
      { name: 'Venus', longitude: 0 },
      { name: 'Saturn', longitude: 0 },
      { name: 'Rahu', longitude: 0 },
      { name: 'Ketu', longitude: 0 },
    ];
  }

  private calculateHouses(lagna: number): any[] {
    const houses = [];
    for (let i = 0; i < 12; i++) {
      houses.push({
        house_number: i + 1,
        start: (lagna + i * 30) % 360,
        end: (lagna + (i + 1) * 30) % 360,
      });
    }
    return houses;
  }

  private calculateNakshatra(longitude: number): any {
    // Simplified nakshatra calculation
    const nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
    ];
    const nakshatraIndex = Math.floor((longitude / 360) * 27);
    return {
      name: nakshatras[nakshatraIndex % 27],
      pada: Math.floor((longitude % 13.333) / 3.333) + 1,
    };
  }

  /**
   * Generate complete kundli update JSON for database update
   * This method calculates complete Janam Kundli and formats it exactly as required
   * for updating the kundli table row using user_id
   */
  async generateKundliUpdateJSON(params: {
    user_id: number;
    birth_date: string; // YYYY-MM-DD
    birth_time: string; // HH:mm:ss
    birth_place: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }): Promise<{
    kundli_db_update: {
      where: { user_id: number };
      update: any;
    };
  }> {
    try {
      const { user_id, birth_date, birth_time, birth_place, latitude, longitude, timezone } = params;

      // Parse birth date and time
      const birthDateTime = new Date(`${birth_date}T${birth_time}`);

      // Calculate kundli using Swiss Ephemeris (Lahiri Ayanamsa)
      const swissData = await this.swissEphemerisService.calculateKundli({
        datetime: birthDateTime,
        latitude,
        longitude,
        timezone: timezone || 'Asia/Kolkata',
        ayanamsa: 1, // Lahiri (default)
      });

      // Assign planets to houses
      const planetsWithHouses = this.swissEphemerisService.assignPlanetsToHouses(
        swissData.planets,
        swissData.houses,
      );

      // Get Moon for nakshatra
      const moon = planetsWithHouses.find((p) => p.name === 'Moon');
      const nakshatraName = swissData.nakshatra.name || '';
      const nakshatraPada = swissData.nakshatra.pada || 1;

      // Calculate Vimshottari Dasha
      const dashaData = this.calculateVimshottariDasha(
        birthDateTime,
        nakshatraName,
        swissData.nakshatra.lord,
      );

      // Calculate Bhav Analysis
      const bhavAnalysis = this.calculateBhavAnalysis(planetsWithHouses, swissData.houses);

      // Calculate Yog Details
      const yogDetails = this.calculateYogDetails(planetsWithHouses, swissData.houses);

      // Calculate Dosha Details
      const doshaDetails = this.calculateDoshaDetails(planetsWithHouses, swissData.houses);

      // Calculate Gochar Analysis
      const gocharAnalysis = this.calculateGocharAnalysis(planetsWithHouses);

      // Format planetary positions
      const grahaSthiti: Record<string, any> = {};
      const planetNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
      const planetMap: Record<string, string> = {
        Sun: 'surya',
        Moon: 'chandra',
        Mars: 'mangal',
        Mercury: 'budh',
        Jupiter: 'guru',
        Venus: 'shukra',
        Saturn: 'shani',
        Rahu: 'rahu',
        Ketu: 'ketu',
      };

      planetsWithHouses.forEach((planet) => {
        const key = planetMap[planet.name] || planet.name.toLowerCase();
        grahaSthiti[key] = {
          name: planet.name,
          longitude: planet.longitude,
          sign: planet.sign,
          sign_lord: planet.signLord,
          nakshatra: planet.nakshatra,
          nakshatra_lord: planet.nakshatraLord,
          nakshatra_pada: planet.nakshatraPada,
          house: planet.house,
          is_retrograde: planet.isRetrograde,
        };
      });

      // Get Lagna sign
      const lagnaSign = swissData.lagna.sign;
      const lagnaDegrees = swissData.lagna.degrees;

      // Get Janma Rashi (Moon sign) and Surya Rashi (Sun sign)
      const moonPlanet = planetsWithHouses.find((p) => p.name === 'Moon');
      const sunPlanet = planetsWithHouses.find((p) => p.name === 'Sun');
      const janmaRashi = moonPlanet?.sign || '';
      const suryaRashi = sunPlanet?.sign || '';
      const moonLongitudeDeg = moonPlanet?.longitude || 0;

      // Build the update JSON
      const updateData = {
        birth_date: birth_date,
        birth_time: birth_time,
        birth_place: birth_place,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        timezone: timezone || 'Asia/Kolkata',

        lagna_degrees: lagnaDegrees.toString(),
        lagna_name: lagnaSign,

        nakshatra: nakshatraName,
        pada: nakshatraPada,

        tithi: swissData.tithi || '',
        yoga: swissData.yoga || '',
        karana: swissData.karana || '',

        ayanamsa: swissData.ayanamsa.toString(),

        full_data: {
          basic_details: {
            janma_rashi: janmaRashi,
            surya_rashi: suryaRashi,
            moon_longitude_deg: moonLongitudeDeg.toString(),
          },
          graha_sthiti: grahaSthiti,
          bhav_analysis: bhavAnalysis,
          yog_details: yogDetails,
          dosha_details: doshaDetails,
          gochar_analysis: gocharAnalysis,
          health_indicators: {},
          career_indicators: {},
          marriage_indicators: {},
        },

        dasha_timeline: dashaData,

        navamsa_data: {
          d9_chart: {},
          marriage_strength: '',
        },

        modify_date: new Date().toISOString(),
      };

      return {
        kundli_db_update: {
          where: {
            user_id: user_id,
          },
          update: updateData,
        },
      };
    } catch (error) {
      this.logger.error('Error generating kundli update JSON:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to generate kundli update JSON',
      );
    }
  }

  /**
   * Calculate Vimshottari Dasha periods
   */
  private calculateVimshottariDasha(
    birthDate: Date,
    nakshatraName: string,
    nakshatraLord: string,
  ): any {
    const dashaSequence = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    const dashaDurations: Record<string, number> = {
      Ketu: 7,
      Venus: 20,
      Sun: 6,
      Moon: 10,
      Mars: 7,
      Rahu: 18,
      Jupiter: 16,
      Saturn: 19,
      Mercury: 17,
    };

    // Find starting dasha from nakshatra lord
    const startIndex = dashaSequence.indexOf(nakshatraLord);
    const actualStartIndex = startIndex !== -1 ? startIndex : dashaSequence.indexOf('Moon');

    // Calculate Mahadasha periods
    const mahadashas: Array<{ lord: string; start: Date; end: Date }> = [];
    let currentDate = new Date(birthDate);

    // Calculate next 120 years of dashas (full cycle)
    for (let i = 0; i < 9; i++) {
      const lordIndex = (actualStartIndex + i) % 9;
      const lord = dashaSequence[lordIndex];
      const duration = dashaDurations[lord];
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      end.setTime(end.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);

      mahadashas.push({ lord, start, end });
      currentDate = new Date(end);
    }

    // Find current mahadasha
    const now = new Date();
    const currentMaha = mahadashas.find((m) => now >= m.start && now < m.end) || mahadashas[0];

    // Calculate current antardasha
    const antaraSequence = dashaSequence;
    const antaraStartIndex = dashaSequence.indexOf(currentMaha.lord);
    const antaraStartDate = currentMaha.start;
    const antaraDuration = (dashaDurations[antaraSequence[antaraStartIndex]] / 120) * dashaDurations[currentMaha.lord];
    const currentAntara = antaraSequence[antaraStartIndex];

    // Calculate current pratyantar
    const pratyantarStartIndex = dashaSequence.indexOf(currentAntara);
    const currentPratyantar = antaraSequence[pratyantarStartIndex];

    return {
      vimshottari: {
        mahadasha: mahadashas.map((m) => ({
          lord: m.lord,
          start: m.start.toISOString(),
          end: m.end.toISOString(),
          duration_years: dashaDurations[m.lord],
        })),
        current_mahadasha: currentMaha.lord,
        current_antardasha: currentAntara,
        current_pratyantar: currentPratyantar,
      },
    };
  }

  /**
   * Calculate Bhav (House) Analysis
   */
  private calculateBhavAnalysis(planets: any[], houses: any[]): Record<string, string> {
    const bhavAnalysis: Record<string, string> = {};

    for (let i = 1; i <= 12; i++) {
      const housePlanets = planets.filter((p) => p.house === i);
      const house = houses.find((h) => h.houseNumber === i);

      if (housePlanets.length > 0) {
        const planetNames = housePlanets.map((p) => p.name).join(', ');
        bhavAnalysis[`bhav_${i}`] = `${house?.sign || ''} sign with ${planetNames}`;
      } else {
        bhavAnalysis[`bhav_${i}`] = `${house?.sign || ''} sign - empty`;
      }
    }

    return bhavAnalysis;
  }

  /**
   * Calculate Yog Details
   */
  private calculateYogDetails(planets: any[], houses: any[]): {
    raj_yog: string[];
    dhan_yog: string[];
    vipreet_raj_yog: string[];
    neecha_bhanga: string[];
  } {
    const yogs = {
      raj_yog: [] as string[],
      dhan_yog: [] as string[],
      vipreet_raj_yog: [] as string[],
      neecha_bhanga: [] as string[],
    };

    // Simplified yog calculations - can be enhanced with full logic
    const sun = planets.find((p) => p.name === 'Sun');
    const moon = planets.find((p) => p.name === 'Moon');
    const jupiter = planets.find((p) => p.name === 'Jupiter');

    // Raj Yog: Benefic planets in kendras (1, 4, 7, 10) or trikonas (1, 5, 9)
    if (jupiter && ([1, 4, 7, 10, 5, 9].includes(jupiter.house))) {
      yogs.raj_yog.push('Jupiter in Kendra/Trikona');
    }

    // Dhan Yog: 2nd, 5th, 9th, 11th houses with benefic planets
    const dhanHouses = [2, 5, 9, 11];
    const benefics = planets.filter((p) => ['Jupiter', 'Venus', 'Mercury'].includes(p.name));
    benefics.forEach((planet) => {
      if (dhanHouses.includes(planet.house)) {
        yogs.dhan_yog.push(`${planet.name} in ${planet.house}th house`);
      }
    });

    return yogs;
  }

  /**
   * Calculate Dosha Details
   */
  private calculateDoshaDetails(planets: any[], houses: any[]): {
    mangal_dosha: boolean;
    kaal_sarp_dosha: boolean;
    pitru_dosha: boolean;
    guru_chandal_dosha: boolean;
  } {
    const mars = planets.find((p) => p.name === 'Mars');
    const rahu = planets.find((p) => p.name === 'Rahu');
    const ketu = planets.find((p) => p.name === 'Ketu');
    const jupiter = planets.find((p) => p.name === 'Jupiter');

    // Mangal Dosha: Mars in 1, 4, 7, 8, 12
    const mangalDosha = mars && [1, 4, 7, 8, 12].includes(mars.house);

    // Kaal Sarp Dosha: All planets between Rahu and Ketu
    let kaalSarpDosha = false;
    if (rahu && ketu) {
      const rahuHouse = rahu.house;
      const ketuHouse = ketu.house;
      const planetsBetween = planets.filter((p) => {
        if (p.name === 'Rahu' || p.name === 'Ketu') return false;
        return p.house >= Math.min(rahuHouse, ketuHouse) && p.house <= Math.max(rahuHouse, ketuHouse);
      });
      kaalSarpDosha = planetsBetween.length === 7; // All 7 planets between Rahu and Ketu
    }

    // Pitru Dosha: Simplified - Sun and Rahu in same house or aspect
    const pitruDosha = false; // Can be enhanced

    // Guru Chandal Dosha: Jupiter and Rahu in same house
    const guruChandalDosha = jupiter && rahu && jupiter.house === rahu.house;

    return {
      mangal_dosha: mangalDosha || false,
      kaal_sarp_dosha: kaalSarpDosha,
      pitru_dosha: pitruDosha,
      guru_chandal_dosha: guruChandalDosha || false,
    };
  }

  /**
   * Calculate Gochar (Transit) Analysis
   */
  private calculateGocharAnalysis(planets: any[]): {
    shani_gochar: string;
    guru_gochar: string;
    rahu_ketu_gochar: string;
  } {
    const saturn = planets.find((p) => p.name === 'Saturn');
    const jupiter = planets.find((p) => p.name === 'Jupiter');
    const rahu = planets.find((p) => p.name === 'Rahu');
    const ketu = planets.find((p) => p.name === 'Ketu');

    return {
      shani_gochar: saturn ? `Saturn in ${saturn.sign} sign, ${saturn.house}th house` : '',
      guru_gochar: jupiter ? `Jupiter in ${jupiter.sign} sign, ${jupiter.house}th house` : '',
      rahu_ketu_gochar: rahu && ketu
        ? `Rahu in ${rahu.sign}, Ketu in ${ketu.sign}`
        : '',
    };
  }
}

