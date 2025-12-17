import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { IKundliRepository } from '../../core/interfaces/repositories/kundli-repository.interface';
import { Kundli } from '../entities/kundli.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';

@Injectable()
export class KundliService {
  private readonly logger = new Logger(KundliService.name);
  private readonly prokeralaApiKey: string;
  private readonly prokeralaBaseUrl = 'https://api.prokerala.com/v2/astrology';
  private readonly useSwissEphemeris: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject('IKundliRepository')
    private readonly kundliRepository: IKundliRepository,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {
    // Get API key from environment or use free tier (limited)
    this.prokeralaApiKey = this.configService.get<string>('PROKERALA_API_KEY') || '';
    // Use Swiss Ephemeris by default, fallback to Prokerala API if available
    this.useSwissEphemeris = this.configService.get<string>('USE_SWISS_EPHEMERIS') !== 'false';
  }

  /**
   * Generate kundli using Swiss Ephemeris (primary) or Prokerala API (fallback)
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

      let kundliData: any;
      let transformedData: KundliResponseDto;

      // Use Swiss Ephemeris for accurate calculations (primary method)
      if (this.useSwissEphemeris) {
        try {
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
          transformedData = this.transformSwissEphemerisResponse(swissData, dto, planetsWithHouses);
        } catch (swissError) {
          this.logger.warn('Swiss Ephemeris calculation failed, falling back to Prokerala API', swissError);
          // Fallback to Prokerala API
          kundliData = await this.callProkeralaAPI({
            datetime: birthDateTime.toISOString(),
            latitude,
            longitude,
            timezone: timezone || 'Asia/Kolkata',
            ayanamsa: dto.ayanamsa || 1,
          });
          transformedData = this.transformProkeralaResponse(kundliData, dto);
        }
      } else {
        // Use Prokerala API directly
        kundliData = await this.callProkeralaAPI({
          datetime: birthDateTime.toISOString(),
          latitude,
          longitude,
          timezone: timezone || 'Asia/Kolkata',
          ayanamsa: dto.ayanamsa || 1,
        });
        transformedData = this.transformProkeralaResponse(kundliData, dto);
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
   * Call Prokerala API
   */
  private async callProkeralaAPI(params: {
    datetime: string;
    latitude: number;
    longitude: number;
    timezone: string;
    ayanamsa: number;
  }): Promise<any> {
    const url = `${this.prokeralaBaseUrl}/birth-chart`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(
          url,
          {
            datetime: params.datetime,
            coordinates: {
              latitude: params.latitude,
              longitude: params.longitude,
            },
            timezone: params.timezone,
            ayanamsa: params.ayanamsa,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(this.prokeralaApiKey && { Authorization: `Bearer ${this.prokeralaApiKey}` }),
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      // If Prokerala API fails, use fallback calculation
      this.logger.warn('Prokerala API failed, using fallback calculation');
      return this.calculateKundliFallback(params);
    }
  }

  /**
   * Fallback kundli calculation (simplified)
   */
  private calculateKundliFallback(params: {
    datetime: string;
    latitude: number;
    longitude: number;
    timezone: string;
    ayanamsa: number;
  }): any {
    // This is a simplified fallback - in production, use Swiss Ephemeris library
    const birthDate = new Date(params.datetime);
    
    // Basic calculations (simplified - use proper library in production)
    const julianDay = this.toJulianDay(birthDate);
    const lagna = this.calculateLagna(birthDate, params.latitude, params.longitude);
    
    return {
      data: {
        lagna: {
          longitude: lagna,
          sign: this.getSignFromLongitude(lagna),
        },
        planets: this.calculatePlanets(birthDate),
        houses: this.calculateHouses(lagna),
        nakshatra: this.calculateNakshatra(lagna),
        ayanamsa: params.ayanamsa === 1 ? 23.85 : 23.85, // Approximate Lahiri
      },
    };
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
   * Transform Prokerala response to standard format
   */
  private transformProkeralaResponse(apiResponse: any, dto: GenerateKundliDto): KundliResponseDto {
    const data = apiResponse.data || apiResponse;

    // Extract planets
    const planets = (data.planets || []).map((planet: any) => ({
      name: planet.name || planet.id,
      longitude: planet.longitude || 0,
      latitude: planet.latitude || 0,
      sign: planet.sign?.name || this.getSignFromLongitude(planet.longitude || 0),
      sign_lord: planet.sign?.lord || '',
      nakshatra: planet.nakshatra?.name || '',
      nakshatra_lord: planet.nakshatra?.lord || '',
      nakshatra_pada: planet.nakshatra?.pada || 0,
      house: planet.house || 0,
      is_retrograde: planet.isRetrograde || false,
    }));

    // Extract houses
    const houses = (data.houses || []).map((house: any, index: number) => ({
      house_number: index + 1,
      sign: house.sign?.name || '',
      sign_lord: house.sign?.lord || '',
      start_degree: house.start || 0,
      end_degree: house.end || 0,
    }));

    // Extract lagna
    const lagna = data.lagna || data.ascendant || {};
    const lagnaLongitude = lagna.longitude || 0;

    // Extract nakshatra
    const moon = planets.find((p: any) => p.name.toLowerCase() === 'moon') || planets[0];
    const nakshatra = {
      name: moon.nakshatra || '',
      pada: moon.nakshatra_pada || 0,
      lord: moon.nakshatra_lord || '',
    };

    return {
      name: dto.name,
      birth_date: dto.birth_date,
      birth_time: dto.birth_time,
      birth_place: dto.birth_place,
      latitude: dto.latitude || 0,
      longitude: dto.longitude || 0,
      timezone: dto.timezone || 'Asia/Kolkata',
      lagna: {
        sign: this.getSignFromLongitude(lagnaLongitude),
        degrees: lagnaLongitude % 30,
        lord: this.getSignLord(this.getSignFromLongitude(lagnaLongitude)),
      },
      nakshatra,
      planets,
      houses,
      ayanamsa: data.ayanamsa || 23.85,
      tithi: data.tithi?.name || '',
      yoga: data.yoga?.name || '',
      karana: data.karana?.name || '',
      full_data: data,
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
   * Save kundli to database
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
      const kundli = await this.kundliRepository.create({
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
      });

      // Save planets and houses (simplified - implement full logic if needed)
      this.logger.log(`Kundli saved for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to save kundli to database:', error);
      // Don't throw - kundli generation succeeded even if save failed
    }
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
}

