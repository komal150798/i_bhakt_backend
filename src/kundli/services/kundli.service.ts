import { Injectable, Logger, BadRequestException, Inject, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { Kundli } from '../entities/kundli.entity';
import { KundliPlanet } from '../entities/kundli-planet.entity';
import { KundliHouse } from '../entities/kundli-house.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';
import { AIKundliService } from '../../astrology/services/ai-kundli.service';

/**
 * Vimshottari Dasha Constants
 * 
 * Standard Vimshottari Dasha system (120-year cycle) based on:
 * - Jagannatha Hora calculations
 * - Swiss Ephemeris standards
 * - Traditional Vedic astrology texts
 * 
 * DASHA_SEQUENCE: Order of planetary periods (9 planets, repeating every 9 nakshatras)
 * PLANET_YEARS: Duration of each Mahadasha in years (total = 120 years)
 * NAKSHATRA_SPAN: Each nakshatra spans exactly 13°20' (40/3 degrees = 13.333... degrees)
 * 
 * The sequence starts with Ashwini (Ketu) and follows the nakshatra lords:
 * Ashwini→Ketu, Bharani→Venus, Krittika→Sun, Rohini→Moon, etc.
 */
const DASHA_SEQUENCE: readonly string[] = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];

const PLANET_YEARS: Record<string, number> = {
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

const TOTAL_CYCLE_YEARS = 120; // Sum of all PLANET_YEARS
const NAKSHATRA_SPAN = 40 / 3; // Exactly 13°20' (13.333... degrees)
const SIDEREAL_YEAR_DAYS = 365.256363004; // Sidereal year for accurate calculations
const MS_PER_DAY = 86400000; // Milliseconds per day
const JD_UNIX_EPOCH = 2440587.5; // Julian Day of Unix epoch (1970-01-01 00:00:00 UTC)

/**
 * Explicit Nakshatra → Dasha Lord Mapping (27 nakshatras)
 * 
 * This array maps each of the 27 nakshatras (index 0-26) to its dasha lord.
 * Each nakshatra spans exactly 13°20' (40/3 degrees).
 * 
 * Reference: Jagannatha Hora, standard Vedic astrology texts
 * Sequence: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury (repeats every 9)
 */
const NAKSHATRA_LORDS: readonly string[] = [
  'Ketu',    // 0: Ashwini (0° - 13°20')
  'Venus',   // 1: Bharani (13°20' - 26°40')
  'Sun',     // 2: Krittika (26°40' - 40°)
  'Moon',    // 3: Rohini (40° - 53°20')
  'Mars',    // 4: Mrigashira (53°20' - 66°40')
  'Rahu',    // 5: Ardra (66°40' - 80°)
  'Jupiter', // 6: Punarvasu (80° - 93°20')
  'Saturn',  // 7: Pushya (93°20' - 106°40')
  'Mercury', // 8: Ashlesha (106°40' - 120°)
  'Ketu',    // 9: Magha (120° - 133°20')
  'Venus',   // 10: Purva Phalguni (133°20' - 146°40')
  'Sun',     // 11: Uttara Phalguni (146°40' - 160°)
  'Moon',    // 12: Hasta (160° - 173°20')
  'Mars',    // 13: Chitra (173°20' - 186°40')
  'Rahu',    // 14: Swati (186°40' - 200°)
  'Jupiter', // 15: Vishakha (200° - 213°20')
  'Saturn',  // 16: Anuradha (213°20' - 226°40')
  'Mercury', // 17: Jyeshtha (226°40' - 240°)
  'Ketu',    // 18: Mula (240° - 253°20')
  'Venus',   // 19: Purva Ashadha (253°20' - 266°40')
  'Sun',     // 20: Uttara Ashadha (266°40' - 280°)
  'Moon',    // 21: Shravana (280° - 293°20')
  'Mars',    // 22: Dhanishta (293°20' - 306°40')
  'Rahu',    // 23: Shatabhisha (306°40' - 320°)
  'Jupiter', // 24: Purva Bhadrapada (320° - 333°20')
  'Saturn',  // 25: Uttara Bhadrapada (333°20' - 346°40')
  'Mercury', // 26: Revati (346°40' - 360°)
];

// Vimshottari Dasha Types
interface MahadashaEntry {
  lord: string;
  startJD: number;
  endJD: number;
  durationYears: number;
  isBalance: boolean;
}

interface DetailedPeriod {
  mahadasha: string;
  antardasha: string;
  pratyantar: string;
  start_date: string;
  end_date: string;
  duration_years: number;
  duration_days: number;
  startJD?: number; // Internal: Julian Day for accurate boundary checks
  endJD?: number;   // Internal: Julian Day for accurate boundary checks
  is_shadow_planet?: boolean; // Metadata: true for Rahu/Ketu periods
}

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);
  private readonly useAICalculation: boolean;

  constructor(
    private readonly httpService: HttpService,
    @Inject('IKundliRepository')
    private readonly kundliRepository: IKundliRepository,
    @InjectRepository(KundliPlanet)
    private readonly kundliPlanetRepository: Repository<KundliPlanet>,
    @InjectRepository(KundliHouse)
    private readonly kundliHouseRepository: Repository<KundliHouse>,
    private readonly swissEphemerisService: SwissEphemerisService,
    @Optional() private readonly aiKundliService: AIKundliService,
    private readonly configService: ConfigService,
  ) {
    // Check if AI-based calculation is enabled via environment variable
    this.useAICalculation = this.configService.get<string>('USE_AI_KUNDLI') === 'true';
    this.logger.log(`Kundli calculation mode: ${this.useAICalculation ? 'AI-based' : 'Swiss Ephemeris'}`);
  }

  /**
   * Generate kundli using Swiss Ephemeris or AI (based on configuration)
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

      let transformedData: KundliResponseDto;

      // Use AI-based calculation if enabled and service is available
      if (this.useAICalculation && this.aiKundliService) {
        this.logger.log('Using AI for kundli calculation');
        try {
          const aiData = await this.aiKundliService.calculateKundli({
            birthDate: dto.birth_date,
            birthTime: dto.birth_time,
            birthPlace: dto.birth_place,
            latitude,
            longitude,
            timezone: timezone || 'Asia/Kolkata',
          });

          // Calculate Vimshottari Dasha timeline
          // Get Moon longitude from AI data for accurate balance calculation
          // AI returns degrees within sign, need to calculate absolute longitude
          const aiMoon = aiData.planets?.find((p: any) => p.name === 'Moon');
          let moonLongitude: number | undefined;
          if (aiMoon) {
            const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
            const signIndex = signs.indexOf(aiMoon.sign);
            if (signIndex !== -1) {
              moonLongitude = signIndex * 30 + (aiMoon.degrees || 0);
            }
          }
          const dashaTimeline = this.calculateVimshottariDasha(
            birthDateTime,
            aiData.nakshatra.name,
            aiData.nakshatra.lord,
            moonLongitude,
          );

          // Transform AI data to our standard format
          transformedData = this.transformAIKundliResponse(
            aiData,
            dto,
            dashaTimeline,
            { latitude, longitude, timezone: timezone || 'Asia/Kolkata' },
          );
        } catch (aiError) {
          // Fallback to Swiss Ephemeris if AI calculation fails
          this.logger.warn(`AI calculation failed, falling back to Swiss Ephemeris: ${aiError}`);
          transformedData = await this.calculateWithSwissEphemeris(
            dto,
            birthDateTime,
            latitude,
            longitude,
            timezone || 'Asia/Kolkata',
          );
        }
      } else {
        // Use Swiss Ephemeris for calculations
        transformedData = await this.calculateWithSwissEphemeris(
          dto,
          birthDateTime,
          latitude,
          longitude,
          timezone || 'Asia/Kolkata',
        );
      }

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
   * Calculate Kundli using Swiss Ephemeris
   */
  private async calculateWithSwissEphemeris(
    dto: GenerateKundliDto,
    birthDateTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
  ): Promise<KundliResponseDto> {
    this.logger.log('Using Swiss Ephemeris for kundli calculation');
    const swissData = await this.swissEphemerisService.calculateKundli({
      datetime: birthDateTime,
      latitude,
      longitude,
      timezone,
      ayanamsa: dto.ayanamsa || 1, // 1 = Lahiri (default)
    });

    // Assign planets to houses
    const planetsWithHouses = this.swissEphemerisService.assignPlanetsToHouses(
      swissData.planets,
      swissData.houses,
    );

    // Get Moon's sidereal longitude for accurate Dasha balance calculation
    const moon = swissData.planets.find((p) => p.name === 'Moon');
    const moonLongitude = moon?.longitude;

    // Calculate Vimshottari Dasha timeline
    // If dasha_balance_years is provided, use it as override
    const dashaTimeline = this.calculateVimshottariDasha(
      birthDateTime,
      swissData.nakshatra.name,
      swissData.nakshatra.lord,
      moonLongitude,
      dto.dasha_balance_years,
    );

    // Transform Swiss Ephemeris data to our standard format (includes dasha)
    return this.transformSwissEphemerisResponse(
      swissData,
      dto,
      planetsWithHouses,
      dashaTimeline,
      { latitude, longitude, timezone },
    );
  }

  /**
   * Transform Swiss Ephemeris data to standard format
   */
  private transformSwissEphemerisResponse(
    swissData: any,
    dto: GenerateKundliDto,
    planetsWithHouses: any[],
    dashaTimeline?: any,
    calculatedCoords?: { latitude: number; longitude: number; timezone: string },
  ): KundliResponseDto {
    // Use calculated coordinates if DTO doesn't have them
    const latitude = dto.latitude || calculatedCoords?.latitude || 0;
    const longitude = dto.longitude || calculatedCoords?.longitude || 0;
    const timezone = dto.timezone || calculatedCoords?.timezone || 'Asia/Kolkata';

    return {
      name: dto.name,
      birth_date: dto.birth_date,
      birth_time: dto.birth_time,
      birth_place: dto.birth_place,
      latitude,
      longitude,
      timezone,
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
      dasha_timeline: dashaTimeline || null,
      full_data: {
        ...swissData,
        dasha_timeline: dashaTimeline,
      },
    };
  }

  /**
   * Transform AI Kundli data to standard format
   */
  private transformAIKundliResponse(
    aiData: any,
    dto: GenerateKundliDto,
    dashaTimeline?: any,
    calculatedCoords?: { latitude: number; longitude: number; timezone: string },
  ): KundliResponseDto {
    const latitude = dto.latitude || calculatedCoords?.latitude || 0;
    const longitude = dto.longitude || calculatedCoords?.longitude || 0;
    const timezone = dto.timezone || calculatedCoords?.timezone || 'Asia/Kolkata';

    // Calculate houses based on Lagna (Whole Sign system)
    const signLords: Record<string, string> = {
      Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
      Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
      Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
    };
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const lagnaSignIndex = signs.indexOf(aiData.lagna.sign);

    const houses = [];
    for (let i = 0; i < 12; i++) {
      const signIndex = (lagnaSignIndex + i) % 12;
      const sign = signs[signIndex];
      houses.push({
        house_number: i + 1,
        sign,
        sign_lord: signLords[sign],
        start_degree: 0,
        end_degree: 30,
      });
    }

    return {
      name: dto.name,
      birth_date: dto.birth_date,
      birth_time: dto.birth_time,
      birth_place: dto.birth_place,
      latitude,
      longitude,
      timezone,
      lagna: {
        sign: aiData.lagna.sign,
        degrees: aiData.lagna.degrees,
        lord: aiData.lagna.signLord,
      },
      nakshatra: {
        name: aiData.nakshatra.name,
        pada: aiData.nakshatra.pada,
        lord: aiData.nakshatra.lord,
      },
      planets: aiData.planets.map((planet: any) => ({
        name: planet.name,
        longitude: (signs.indexOf(planet.sign) * 30) + planet.degrees,
        latitude: 0,
        sign: planet.sign,
        sign_lord: planet.signLord,
        nakshatra: planet.nakshatra,
        nakshatra_lord: planet.nakshatraLord,
        nakshatra_pada: planet.nakshatraPada,
        house: planet.house,
        is_retrograde: planet.isRetrograde,
      })),
      houses,
      ayanamsa: aiData.ayanamsa,
      tithi: aiData.tithi || '',
      yoga: aiData.yoga || '',
      karana: aiData.karana || '',
      dasha_timeline: dashaTimeline || null,
      full_data: {
        ...aiData,
        dasha_timeline: dashaTimeline,
      },
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
          latitude: Number.parseFloat(result.lat),
          longitude: Number.parseFloat(result.lon),
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
      // Get Moon longitude from kundli data
      const moonPlanet = kundliData.planets?.find((p) => p.name === 'Moon');
      const moonLongitude = moonPlanet?.longitude;
      const dashaTimeline = this.calculateVimshottariDasha(
        birthDateTime,
        kundliData.nakshatra.name,
        kundliData.nakshatra.lord,
        moonLongitude,
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

      // Get Moon for nakshatra and Dasha calculation
      const moonForDasha = planetsWithHouses.find((p) => p.name === 'Moon');
      const nakshatraName = swissData.nakshatra.name || '';
      const nakshatraPada = swissData.nakshatra.pada || 1;

      // Calculate Vimshottari Dasha
      const dashaData = this.calculateVimshottariDasha(
        birthDateTime,
        nakshatraName,
        swissData.nakshatra.lord,
        moonForDasha?.longitude,
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
   * Calculate Vimshottari Dasha periods with full Antardasha and Pratyantar details
   * 
   * Standard Vimshottari Dasha system (120-year cycle):
   * - Based on Moon's nakshatra at birth
   * - 9 planetary periods: Ketu(7), Venus(20), Sun(6), Moon(10), Mars(7), 
   *   Rahu(18), Jupiter(16), Saturn(19), Mercury(17) years
   * - Each nakshatra spans 13°20' (40/3 degrees)
   * - Balance of first Mahadasha calculated from Moon's position within nakshatra
   * 
   * Reference: Jagannatha Hora, Swiss Ephemeris, standard Vedic astrology texts
   * 
   * @param birthDate - Birth date and time
   * @param _nakshatraName - Nakshatra name (for reference, not used in calculation)
   * @param nakshatraLord - Lord of birth nakshatra (fallback)
   * @param moonLongitude - Moon's sidereal longitude (0-360 degrees) - REQUIRED for accuracy
   * @param balanceOverride - Optional override for balance years (for testing/correction)
   * @returns Complete Vimshottari Dasha timeline with Mahadasha, Antardasha, Pratyantar
   */
  private calculateVimshottariDasha(
    birthDate: Date,
    _nakshatraName: string,
    nakshatraLord: string,
    moonLongitude?: number,
    balanceOverride?: number,
  ): any {
    // Validate inputs
    if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      this.logger.error('Invalid birth date provided for Vimshottari Dasha calculation');
      throw new BadRequestException('Invalid birth date');
    }

    // Determine birth Dasha lord and remaining fraction from Moon longitude
    const { birthDashaLord, remainingFraction } = this.calculateBirthDashaLord(
      moonLongitude,
      nakshatraLord,
    );

    // Validate dasha lord
    if (!DASHA_SEQUENCE.includes(birthDashaLord)) {
      this.logger.error(`Invalid dasha lord: ${birthDashaLord}, defaulting to Moon`);
      const fallbackLord = 'Moon';
      const fallbackFraction = 1.0;
      return this.calculateVimshottariDasha(
        birthDate,
        _nakshatraName,
        fallbackLord,
        moonLongitude,
        balanceOverride,
      );
    }

    // Calculate balance years for birth Mahadasha
    const fullMahaYears = PLANET_YEARS[birthDashaLord];
    if (!fullMahaYears || fullMahaYears <= 0) {
      this.logger.error(`Invalid planet years for ${birthDashaLord}`);
      throw new BadRequestException(`Invalid dasha configuration for ${birthDashaLord}`);
    }

    const balanceYears = this.calculateBalanceYears(
      balanceOverride,
      fullMahaYears,
      remainingFraction,
    );

    this.logger.debug(
      `Vimshottari Dasha: Birth Mahadasha=${birthDashaLord}, ` +
      `Full Duration=${fullMahaYears} years, ` +
      `Balance=${balanceYears.toFixed(6)} years (${(remainingFraction * 100).toFixed(2)}% remaining)`
    );

    // Convert birth date to Julian Day for accurate calculations
    const birthJD = this.dateToJD(birthDate);
    const birthLordIndex = DASHA_SEQUENCE.indexOf(birthDashaLord);

    if (birthLordIndex === -1) {
      this.logger.error(`Birth dasha lord ${birthDashaLord} not found in sequence`);
      throw new BadRequestException(`Invalid dasha lord: ${birthDashaLord}`);
    }

    // Build complete Mahadasha timeline (120+ years)
    const mahadashaTimeline = this.buildMahadashaTimeline(
      birthJD,
      balanceYears,
      birthLordIndex,
    );

    // Build detailed timeline with Antardasha/Pratyantar for current and upcoming periods
    const detailedTimeline = this.buildDetailedTimeline(
      mahadashaTimeline,
      birthJD,
      balanceYears,
    );

    // Find current periods
    const nowJD = this.dateToJD(new Date());
    const currentMaha =
      mahadashaTimeline.find((m) => nowJD >= m.startJD && nowJD < m.endJD) ||
      mahadashaTimeline[0];
    const currentPeriod = this.findCurrentPeriod(detailedTimeline, nowJD);

    // Format response in standard structure
    return {
      vimshottari: {
        birth_dasha_lord: birthDashaLord,
        balance_years: Number.parseFloat(balanceYears.toFixed(6)),
        balance_days: Math.round(balanceYears * SIDEREAL_YEAR_DAYS),
        mahadasha: mahadashaTimeline.slice(0, 12).map((m) => ({
          lord: m.lord,
          start: this.formatJDToDateString(m.startJD),
          end: this.formatJDToDateString(m.endJD),
          duration_years: Number.parseFloat(m.durationYears.toFixed(6)),
          duration_days: Math.round(m.durationYears * SIDEREAL_YEAR_DAYS),
          is_balance: m.isBalance,
          is_shadow_planet: m.lord === 'Rahu' || m.lord === 'Ketu', // Metadata flag for shadow planets
        })),
        current_mahadasha: currentMaha.lord,
        current_antardasha:
          currentPeriod?.antardasha || DASHA_SEQUENCE[birthLordIndex],
        current_pratyantar:
          currentPeriod?.pratyantar || DASHA_SEQUENCE[birthLordIndex],
        detailed_timeline: detailedTimeline.map((period) => {
          // Remove internal Julian Day fields before returning to API
          return {
            mahadasha: period.mahadasha,
            antardasha: period.antardasha,
            pratyantar: period.pratyantar,
            start_date: period.start_date,
            end_date: period.end_date,
            duration_years: period.duration_years,
            duration_days: period.duration_days,
            ...(period.is_shadow_planet !== undefined && { is_shadow_planet: period.is_shadow_planet }),
          };
        }),
      },
    };
  }

  /**
   * Convert JavaScript Date to Julian Day Number
   * 
   * Julian Day is a continuous count of days since noon UTC on January 1, 4713 BCE.
   * This is the standard for astronomical calculations.
   * 
   * @param date - JavaScript Date object
   * @returns Julian Day number
   */
  private dateToJD(date: Date): number {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      this.logger.error('Invalid date provided to dateToJD');
      throw new BadRequestException('Invalid date for Julian Day conversion');
    }
    return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
  }

  /**
   * Convert Julian Day Number to JavaScript Date
   * 
   * @param jd - Julian Day number
   * @returns JavaScript Date object
   */
  private jdToDate(jd: number): Date {
    if (!Number.isFinite(jd) || jd < 0) {
      this.logger.error(`Invalid Julian Day: ${jd}`);
      throw new BadRequestException(`Invalid Julian Day: ${jd}`);
    }
    return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
  }

  /**
   * Add sidereal years to a Julian Day
   * 
   * Uses sidereal year (365.256363004 days) for accurate Vedic calculations.
   * This accounts for precession and ensures dasha periods align with actual
   * astronomical positions.
   * 
   * @param jd - Starting Julian Day
   * @param years - Number of sidereal years to add
   * @returns New Julian Day after adding years
   */
  private addYearsToJD(jd: number, years: number): number {
    if (!Number.isFinite(jd) || !Number.isFinite(years)) {
      this.logger.error(`Invalid parameters for addYearsToJD: jd=${jd}, years=${years}`);
      throw new BadRequestException('Invalid parameters for date calculation');
    }
    return jd + years * SIDEREAL_YEAR_DAYS;
  }

  /**
   * Format Julian Day as ISO date string (YYYY-MM-DD)
   * 
   * @param jd - Julian Day number
   * @returns Date string in YYYY-MM-DD format
   */
  private formatJDToDateString(jd: number): string {
    const date = this.jdToDate(jd);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate birth Dasha lord and remaining fraction from Moon longitude
   * 
   * Standard Vimshottari Dasha calculation based on:
   * - Moon's sidereal longitude determines the nakshatra
   * - Each nakshatra spans exactly 13°20' (40/3 degrees)
   * - The dasha lord is determined by explicit NAKSHATRA_LORDS mapping (not modulo)
   * - Balance is calculated based on position within the nakshatra
   * 
   * Reference: Jagannatha Hora, Swiss Ephemeris standards
   * 
   * @param moonLongitude - Moon's sidereal longitude (0-360 degrees)
   * @param nakshatraLord - Lord of the nakshatra (fallback if longitude unavailable)
   * @returns Birth dasha lord and remaining fraction (0-1)
   */
  private calculateBirthDashaLord(
    moonLongitude: number | undefined,
    nakshatraLord: string,
  ): { birthDashaLord: string; remainingFraction: number } {
    // Use Moon's sidereal longitude for accurate calculation
    if (moonLongitude !== undefined && moonLongitude >= 0 && moonLongitude <= 360) {
      // Normalize longitude to 0-360 range (360° becomes 0°)
      const normalizedLongitude = moonLongitude === 360 ? 0 : ((moonLongitude % 360) + 360) % 360;
      
      // Calculate nakshatra index (0-26, each nakshatra = 13°20' = 40/3 degrees)
      // Nakshatras start at 0° (Ashwini) and continue in sequence
      const nakshatraIndex = Math.floor(normalizedLongitude / NAKSHATRA_SPAN);
      
      // Clamp nakshatra index to valid range (0-26)
      // Edge case: if normalizedLongitude is exactly 360° (shouldn't happen after normalization), use index 26 (Revati)
      const clampedIndex = Math.min(nakshatraIndex, NAKSHATRA_LORDS.length - 1);
      
      // Use explicit NAKSHATRA_LORDS array mapping (matches Jagannatha Hora)
      // This is more accurate than modulo operation
      const birthDashaLord = NAKSHATRA_LORDS[clampedIndex];
      
      // Calculate position within the current nakshatra (0-1)
      const positionInNakshatra = (normalizedLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
      
      // Remaining fraction = portion of nakshatra yet to be traversed
      // This determines the balance of the birth Mahadasha
      const remainingFraction = 1 - positionInNakshatra;
      
      this.logger.debug(
        `Vimshottari Dasha Calculation: ` +
        `Moon=${normalizedLongitude.toFixed(6)}°, ` +
        `Nakshatra#=${clampedIndex}, ` +
        `Lord=${birthDashaLord}, ` +
        `PositionInNakshatra=${(positionInNakshatra * 100).toFixed(4)}%, ` +
        `Remaining=${(remainingFraction * 100).toFixed(4)}%`
      );
      
      return { birthDashaLord, remainingFraction };
    }

    // Fallback: Use provided nakshatra lord if Moon longitude unavailable
    this.logger.warn(
      `Moon longitude not available (${moonLongitude}), using nakshatra lord fallback: ${nakshatraLord}`
    );
    
    const startIndex = DASHA_SEQUENCE.indexOf(nakshatraLord);
    const birthDashaLord = startIndex !== -1 ? nakshatraLord : DASHA_SEQUENCE[3]; // Default to Moon
    
    // Without exact position, assume full balance (start of dasha)
    return { birthDashaLord, remainingFraction: 1.0 };
  }

  /**
   * Calculate balance years for the birth Mahadasha
   * 
   * The balance is the remaining portion of the first Mahadasha period
   * based on Moon's position within the birth nakshatra.
   * 
   * @param balanceOverride - Optional manual override (for corrections/testing)
   * @param fullMahaYears - Full duration of the Mahadasha in years
   * @param remainingFraction - Fraction of nakshatra remaining (0-1)
   * @returns Balance years for the birth Mahadasha
   */
  private calculateBalanceYears(
    balanceOverride: number | undefined,
    fullMahaYears: number,
    remainingFraction: number,
  ): number {
    // Validate inputs
    if (!Number.isFinite(fullMahaYears) || fullMahaYears <= 0) {
      this.logger.error(`Invalid fullMahaYears: ${fullMahaYears}`);
      throw new BadRequestException(`Invalid Mahadasha duration: ${fullMahaYears}`);
    }

    if (!Number.isFinite(remainingFraction) || remainingFraction < 0 || remainingFraction > 1) {
      this.logger.warn(
        `Invalid remainingFraction: ${remainingFraction}, defaulting to 1.0 (full period)`
      );
      return fullMahaYears;
    }

    // Allow manual override for corrections (must be valid)
    if (
      balanceOverride !== undefined &&
      Number.isFinite(balanceOverride) &&
      balanceOverride > 0 &&
      balanceOverride <= fullMahaYears
    ) {
      this.logger.debug(
        `Using balance override: ${balanceOverride} years (instead of calculated ${remainingFraction * fullMahaYears})`
      );
      return balanceOverride;
    }

    // Standard calculation: balance = remaining fraction × full duration
    const calculatedBalance = remainingFraction * fullMahaYears;
    
    // Ensure balance is within valid range
    if (calculatedBalance <= 0 || calculatedBalance > fullMahaYears) {
      this.logger.warn(
        `Calculated balance ${calculatedBalance} out of range, using full period`
      );
      return fullMahaYears;
    }

    return calculatedBalance;
  }

  /**
   * Find current period from detailed timeline
   * 
   * Uses Julian Day internally for accurate boundary checks (timezone-safe).
   * Date strings are formatting output only.
   */
  private findCurrentPeriod(timeline: DetailedPeriod[], nowJD: number): DetailedPeriod | undefined {
    return timeline.find(d => {
      // Use stored JD if available (more accurate), otherwise parse from date string
      const startJD = d.startJD ?? this.dateToJD(new Date(d.start_date + 'T00:00:00'));
      const endJD = d.endJD ?? this.dateToJD(new Date(d.end_date + 'T00:00:00'));
      return nowJD >= startJD && nowJD < endJD;
    });
  }

  /**
   * Build complete Mahadasha timeline starting from birth
   * 
   * Creates a timeline of all 9 Mahadashas in sequence, starting with
   * the balance period of the birth Mahadasha, followed by full periods.
   * 
   * Standard Vimshottari sequence (120 years total):
   * 1. Balance of birth Mahadasha (partial)
   * 2. Remaining 8 Mahadashas (full periods)
   * 3. Next cycle (for extended timeline)
   * 
   * @param birthJD - Birth Julian Day
   * @param balanceYears - Balance years for birth Mahadasha
   * @param birthLordIndex - Index of birth Mahadasha lord in DASHA_SEQUENCE
   * @returns Array of Mahadasha entries with start/end dates
   */
  private buildMahadashaTimeline(
    birthJD: number,
    balanceYears: number,
    birthLordIndex: number,
  ): MahadashaEntry[] {
    // Validate inputs
    if (!Number.isFinite(birthJD) || birthJD <= 0) {
      this.logger.error(`Invalid birthJD: ${birthJD}`);
      throw new BadRequestException(`Invalid birth Julian Day: ${birthJD}`);
    }

    if (birthLordIndex < 0 || birthLordIndex >= DASHA_SEQUENCE.length) {
      this.logger.error(`Invalid birthLordIndex: ${birthLordIndex}`);
      throw new BadRequestException(`Invalid dasha lord index: ${birthLordIndex}`);
    }

    const mahadashas: MahadashaEntry[] = [];
    let currentJD = birthJD;

    // First Mahadasha: balance portion only (remaining part of birth nakshatra)
    const birthLord = DASHA_SEQUENCE[birthLordIndex];
    const firstMahaEndJD = this.addYearsToJD(currentJD, balanceYears);

    mahadashas.push({
      lord: birthLord,
      startJD: currentJD,
      endJD: firstMahaEndJD,
      durationYears: balanceYears,
      isBalance: true,
    });

    this.logger.debug(
      `Mahadasha #1 (Balance): ${birthLord} from JD ${currentJD.toFixed(2)} to ${firstMahaEndJD.toFixed(2)} ` +
      `(${balanceYears.toFixed(6)} years)`
    );

    currentJD = firstMahaEndJD;

    // Subsequent Mahadashas: full duration periods
    // Build 2 complete cycles (18 periods) for 120+ years coverage
    const cyclesToBuild = 2;
    const periodsPerCycle = 9;

    for (let cycle = 0; cycle < cyclesToBuild; cycle++) {
      for (let i = 1; i <= periodsPerCycle; i++) {
        // Calculate next lord in sequence (skip birth lord, start from next)
        const lordIndex = (birthLordIndex + i) % DASHA_SEQUENCE.length;
        const lord = DASHA_SEQUENCE[lordIndex];
        const duration = PLANET_YEARS[lord];

        if (!duration || duration <= 0) {
          this.logger.error(`Invalid duration for ${lord}: ${duration}`);
          continue; // Skip invalid entries
        }

        const endJD = this.addYearsToJD(currentJD, duration);
        const periodNumber = mahadashas.length + 1;

        mahadashas.push({
          lord,
          startJD: currentJD,
          endJD,
          durationYears: duration,
          isBalance: false,
        });

        this.logger.debug(
          `Mahadasha #${periodNumber}: ${lord} from JD ${currentJD.toFixed(2)} to ${endJD.toFixed(2)} ` +
          `(${duration} years)`
        );

        currentJD = endJD;
      }
    }

    // Verify total duration matches expected 120 years
    const totalDuration = mahadashas.reduce((sum, m) => sum + m.durationYears, 0);
    const expectedDuration = balanceYears + TOTAL_CYCLE_YEARS;
    const durationDiff = Math.abs(totalDuration - expectedDuration);

    if (durationDiff > 0.01) {
      this.logger.warn(
        `Total Mahadasha duration ${totalDuration.toFixed(6)} years differs from expected ` +
        `${expectedDuration.toFixed(6)} years by ${durationDiff.toFixed(6)} years`
      );
    }

    return mahadashas;
  }

  /**
   * Build detailed timeline with Antardasha and Pratyantar periods
   * 
   * Generates complete Antardasha and Pratyantar details for ALL Mahadashas
   * in the timeline (not just current + 3). This ensures full 120+ year coverage.
   */
  private buildDetailedTimeline(
    mahadashaTimeline: MahadashaEntry[],
    birthJD: number,
    balanceYears: number,
  ): DetailedPeriod[] {
    const detailedTimeline: DetailedPeriod[] = [];

    // Generate detailed periods for ALL Mahadashas (no truncation)
    for (let mahaIdx = 0; mahaIdx < mahadashaTimeline.length; mahaIdx++) {
      const maha = mahadashaTimeline[mahaIdx];
      const mahaLordIndex = DASHA_SEQUENCE.indexOf(maha.lord);
      const fullMahaDuration = PLANET_YEARS[maha.lord];

      if (maha.isBalance) {
        this.addBalanceMahaPeriods(detailedTimeline, maha, mahaLordIndex, balanceYears, fullMahaDuration, birthJD);
      } else {
        this.addFullMahaPeriods(detailedTimeline, maha, mahaLordIndex);
      }
    }

    return detailedTimeline;
  }

  /**
   * Add periods for balance (partial) Mahadasha - finds exact birth position
   */
  private addBalanceMahaPeriods(
    timeline: DetailedPeriod[],
    maha: MahadashaEntry,
    mahaLordIndex: number,
    balanceYears: number,
    fullMahaDuration: number,
    birthJD: number,
  ): void {
    const elapsedYears = fullMahaDuration - balanceYears;
    const { birthAntarIndex, elapsedInAntar } = this.findBirthAntardasha(mahaLordIndex, fullMahaDuration, elapsedYears);
    const { birthPratyantarIndex, elapsedInPratyantar } =
      this.findBirthPratyantar(mahaLordIndex, birthAntarIndex, fullMahaDuration, elapsedInAntar);

    let currentJD = birthJD;

    for (let a = birthAntarIndex; a < 9; a++) {
      const antarLordIndex = (mahaLordIndex + a) % 9;
      const antarLord = DASHA_SEQUENCE[antarLordIndex];
      const antarDuration = (PLANET_YEARS[antarLord] * fullMahaDuration) / TOTAL_CYCLE_YEARS;
      const antarLordIdxForP = DASHA_SEQUENCE.indexOf(antarLord);
      const startPratyantar = (a === birthAntarIndex) ? birthPratyantarIndex : 0;

      for (let p = startPratyantar; p < 9; p++) {
        const pLordIndex = (antarLordIdxForP + p) % 9;
        const pLord = DASHA_SEQUENCE[pLordIndex];
        let pDuration = (PLANET_YEARS[pLord] * antarDuration) / TOTAL_CYCLE_YEARS;

        // Subtract elapsed portion for first Pratyantar of first Antardasha
        if (a === birthAntarIndex && p === birthPratyantarIndex) {
          pDuration -= elapsedInPratyantar;
        }

        const pEndJD = this.addYearsToJD(currentJD, pDuration);
        timeline.push({
          mahadasha: maha.lord,
          antardasha: antarLord,
          pratyantar: pLord,
          start_date: this.formatJDToDateString(currentJD),
          end_date: this.formatJDToDateString(pEndJD),
          duration_years: Number.parseFloat(pDuration.toFixed(6)),
          duration_days: Math.round(pDuration * SIDEREAL_YEAR_DAYS),
          startJD: currentJD, // Store JD for accurate boundary checks
          endJD: pEndJD,
          is_shadow_planet: pLord === 'Rahu' || pLord === 'Ketu' || antarLord === 'Rahu' || antarLord === 'Ketu' || maha.lord === 'Rahu' || maha.lord === 'Ketu',
        });
        currentJD = pEndJD;
      }
    }
  }

  /**
   * Find which Antardasha was running at birth within the birth Mahadasha
   * 
   * Antardasha duration = (Antardasha lord's years / 120) × Mahadasha duration
   * 
   * @param mahaLordIndex - Index of Mahadasha lord in DASHA_SEQUENCE
   * @param fullMahaDuration - Full duration of Mahadasha in years
   * @param elapsedYears - Years elapsed in Mahadasha at birth (fullMahaDuration - balanceYears)
   * @returns Antardasha index and elapsed time within that Antardasha
   */
  private findBirthAntardasha(
    mahaLordIndex: number,
    fullMahaDuration: number,
    elapsedYears: number,
  ): { birthAntarIndex: number; elapsedInAntar: number } {
    // Validate inputs
    if (!Number.isFinite(fullMahaDuration) || fullMahaDuration <= 0) {
      this.logger.error(`Invalid fullMahaDuration: ${fullMahaDuration}`);
      return { birthAntarIndex: 0, elapsedInAntar: 0 };
    }

    if (!Number.isFinite(elapsedYears) || elapsedYears < 0) {
      this.logger.warn(`Invalid elapsedYears: ${elapsedYears}, defaulting to 0`);
      return { birthAntarIndex: 0, elapsedInAntar: 0 };
    }

    // Clamp elapsed years to Mahadasha duration
    const clampedElapsed = Math.min(elapsedYears, fullMahaDuration);

    let cumulativeYears = 0;

    // Check each Antardasha in sequence
    for (let a = 0; a < DASHA_SEQUENCE.length; a++) {
      const antarLordIndex = (mahaLordIndex + a) % DASHA_SEQUENCE.length;
      const antarLord = DASHA_SEQUENCE[antarLordIndex];
      const antarLordYears = PLANET_YEARS[antarLord];

      if (!antarLordYears || antarLordYears <= 0) {
        this.logger.warn(`Invalid years for Antardasha lord ${antarLord}`);
        continue;
      }

      // Antardasha duration = (lord's years / 120) × Mahadasha duration
      const antarDuration = (antarLordYears * fullMahaDuration) / TOTAL_CYCLE_YEARS;

      // Check if birth occurred within this Antardasha
      if (cumulativeYears + antarDuration > clampedElapsed) {
        const elapsedInAntar = clampedElapsed - cumulativeYears;
        
        this.logger.debug(
          `Birth Antardasha: ${antarLord} (index ${a}), ` +
          `Duration=${antarDuration.toFixed(6)} years, ` +
          `Elapsed=${elapsedInAntar.toFixed(6)} years`
        );

        return { birthAntarIndex: a, elapsedInAntar };
      }

      cumulativeYears += antarDuration;
    }

    // Fallback: return first Antardasha if calculation fails
    this.logger.warn(
      `Could not find birth Antardasha for elapsedYears=${elapsedYears}, ` +
      `fullMahaDuration=${fullMahaDuration}, defaulting to first Antardasha`
    );
    return { birthAntarIndex: 0, elapsedInAntar: 0 };
  }

  /**
   * Find which Pratyantar Dasha was running at birth within the birth Antardasha
   * 
   * Pratyantar duration = (Pratyantar lord's years / 120) × Antardasha duration
   * 
   * @param mahaLordIndex - Index of Mahadasha lord in DASHA_SEQUENCE
   * @param birthAntarIndex - Index of birth Antardasha (0-8)
   * @param fullMahaDuration - Full duration of Mahadasha in years
   * @param elapsedInAntar - Years elapsed in Antardasha at birth
   * @returns Pratyantar index and elapsed time within that Pratyantar
   */
  private findBirthPratyantar(
    mahaLordIndex: number,
    birthAntarIndex: number,
    fullMahaDuration: number,
    elapsedInAntar: number,
  ): { birthPratyantarIndex: number; elapsedInPratyantar: number } {
    // Validate inputs
    if (
      mahaLordIndex < 0 ||
      mahaLordIndex >= DASHA_SEQUENCE.length ||
      birthAntarIndex < 0 ||
      birthAntarIndex >= DASHA_SEQUENCE.length
    ) {
      this.logger.error(
        `Invalid indices: mahaLordIndex=${mahaLordIndex}, birthAntarIndex=${birthAntarIndex}`
      );
      return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
    }

    // Get birth Antardasha lord
    const birthAntarLordIndex = (mahaLordIndex + birthAntarIndex) % DASHA_SEQUENCE.length;
    const birthAntarLord = DASHA_SEQUENCE[birthAntarLordIndex];
    const birthAntarLordYears = PLANET_YEARS[birthAntarLord];

    if (!birthAntarLordYears || birthAntarLordYears <= 0) {
      this.logger.error(`Invalid years for Antardasha lord ${birthAntarLord}`);
      return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
    }

    // Calculate Antardasha duration
    const birthAntarDuration = (birthAntarLordYears * fullMahaDuration) / TOTAL_CYCLE_YEARS;

    // Clamp elapsed time to Antardasha duration
    const clampedElapsed = Math.min(elapsedInAntar, birthAntarDuration);

    let pratyantarCumulative = 0;

    // Check each Pratyantar in sequence
    for (let p = 0; p < DASHA_SEQUENCE.length; p++) {
      const pLordIndex = (birthAntarLordIndex + p) % DASHA_SEQUENCE.length;
      const pLord = DASHA_SEQUENCE[pLordIndex];
      const pLordYears = PLANET_YEARS[pLord];

      if (!pLordYears || pLordYears <= 0) {
        this.logger.warn(`Invalid years for Pratyantar lord ${pLord}`);
        continue;
      }

      // Pratyantar duration = (lord's years / 120) × Antardasha duration
      const pDuration = (pLordYears * birthAntarDuration) / TOTAL_CYCLE_YEARS;

      // Check if birth occurred within this Pratyantar
      if (pratyantarCumulative + pDuration > clampedElapsed) {
        const elapsedInPratyantar = clampedElapsed - pratyantarCumulative;

        this.logger.debug(
          `Birth Pratyantar: ${pLord} (index ${p}), ` +
          `Duration=${pDuration.toFixed(6)} years, ` +
          `Elapsed=${elapsedInPratyantar.toFixed(6)} years`
        );

        return { birthPratyantarIndex: p, elapsedInPratyantar };
      }

      pratyantarCumulative += pDuration;
    }

    // Fallback: return first Pratyantar if calculation fails
    this.logger.warn(
      `Could not find birth Pratyantar for elapsedInAntar=${elapsedInAntar}, ` +
      `birthAntarDuration=${birthAntarDuration}, defaulting to first Pratyantar`
    );
    return { birthPratyantarIndex: 0, elapsedInPratyantar: 0 };
  }

  /**
   * Add periods for full (non-balance) Mahadasha
   */
  private addFullMahaPeriods(timeline: DetailedPeriod[], maha: MahadashaEntry, mahaLordIndex: number): void {
    let antarCurrentJD = maha.startJD;

    for (let a = 0; a < 9; a++) {
      const antarLordIndex = (mahaLordIndex + a) % 9;
      const antarLord = DASHA_SEQUENCE[antarLordIndex];
      const antarDuration = (PLANET_YEARS[antarLord] * maha.durationYears) / TOTAL_CYCLE_YEARS;
      const antarLordIdxForP = DASHA_SEQUENCE.indexOf(antarLord);
      let pCurrentJD = antarCurrentJD;

      for (let p = 0; p < 9; p++) {
        const pLordIndex = (antarLordIdxForP + p) % 9;
        const pLord = DASHA_SEQUENCE[pLordIndex];
        const pDuration = (PLANET_YEARS[pLord] * antarDuration) / TOTAL_CYCLE_YEARS;
        const pEndJD = this.addYearsToJD(pCurrentJD, pDuration);

        timeline.push({
          mahadasha: maha.lord,
          antardasha: antarLord,
          pratyantar: pLord,
          start_date: this.formatJDToDateString(pCurrentJD),
          end_date: this.formatJDToDateString(pEndJD),
          duration_years: Number.parseFloat(pDuration.toFixed(6)),
          duration_days: Math.round(pDuration * SIDEREAL_YEAR_DAYS),
          startJD: pCurrentJD, // Store JD for accurate boundary checks
          endJD: pEndJD,
          is_shadow_planet: pLord === 'Rahu' || pLord === 'Ketu' || antarLord === 'Rahu' || antarLord === 'Ketu' || maha.lord === 'Rahu' || maha.lord === 'Ketu',
        });
        pCurrentJD = pEndJD;
      }

      antarCurrentJD = this.addYearsToJD(antarCurrentJD, antarDuration);
    }
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

