import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetHoroscopeDto } from '../dto/get-horoscope.dto';
import { HoroscopeResponseDto } from '../dto/horoscope-response.dto';
import { Customer } from '../../users/entities/customer.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';

@Injectable()
export class HoroscopeService {
  private readonly logger = new Logger(HoroscopeService.name);

  // Zodiac sign mapping
  private readonly zodiacSigns = {
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

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly swissEphemerisService: SwissEphemerisService,
  ) {}

  /**
   * Get horoscope for a zodiac sign
   * Uses Swiss Ephemeris for accurate calculations
   */
  async getHoroscope(dto: GetHoroscopeDto): Promise<HoroscopeResponseDto> {
    try {
      // Use Swiss Ephemeris to generate horoscope
      this.logger.log(`Generating horoscope using Swiss Ephemeris for ${dto.sign} (${dto.type})`);
      
      const horoscopeData = await this.generateHoroscopeWithSwissEphemeris(dto.sign, dto.type);
      
      return this.transformHoroscopeResponse(horoscopeData, dto);
    } catch (error) {
      this.logger.error('Error getting horoscope:', error);
      // Fallback to basic horoscope if Swiss Ephemeris fails
      const fallbackData = this.generateFallbackHoroscope(dto.sign, dto.type);
      this.logger.warn('Swiss Ephemeris failed, using fallback horoscope');
      return this.transformHoroscopeResponse(fallbackData, dto);
    }
  }

  /**
   * Get horoscope for authenticated user (personalized)
   */
  async getHoroscopeForUser(userId: number, type: 'daily' | 'weekly' | 'monthly'): Promise<HoroscopeResponseDto> {
    try {
      // Get user's birth details
      const customer = await this.customerRepository.findOne({
        where: { id: userId, is_deleted: false },
      });

      if (!customer) {
        throw new NotFoundException('User not found');
      }

      if (!customer.date_of_birth) {
        throw new BadRequestException('Birth date is required to get personalized horoscope. Please update your profile.');
      }

      // Calculate zodiac sign from birth date (using Swiss Ephemeris if available)
      const zodiacSign = await this.calculateZodiacSign(
        customer.date_of_birth,
        customer.time_of_birth || undefined,
        customer.latitude || undefined,
        customer.longitude || undefined,
      );

      // Get horoscope for calculated sign
      const dto: GetHoroscopeDto = {
        sign: zodiacSign,
        type,
      };

      return this.getHoroscope(dto);
    } catch (error) {
      this.logger.error('Error getting personalized horoscope:', error);
      throw new BadRequestException(
        error.response?.data?.message || error.message || 'Failed to get personalized horoscope',
      );
    }
  }

  /**
   * Extract month and day from date (handles both string and Date objects, avoids timezone issues)
   */
  private extractDateComponents(birthDate: Date | string): { month: number; day: number; year: number } {
    if (typeof birthDate === 'string') {
      // Parse string format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
      const dateStr = birthDate.split('T')[0]; // Remove time part if present
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10); // 1-12
        const day = parseInt(parts[2], 10); // 1-31
        this.logger.debug(`Extracted from string: ${year}-${month}-${day}`);
        return { year, month, day };
      }
    }
    
    // For Date objects from database, format as YYYY-MM-DD and parse to avoid timezone issues
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    // Method 1: Try to get local date components (for dates stored in local timezone)
    const localYear = date.getFullYear();
    const localMonth = date.getMonth() + 1;
    const localDay = date.getDate();
    
    // Method 2: Get UTC components (for dates stored as UTC)
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1;
    const utcDay = date.getUTCDate();
    
    // Use the date that makes more sense (usually local for DATE columns in PostgreSQL)
    // But log both for debugging
    this.logger.debug(`Date object - Local: ${localYear}-${localMonth}-${localDay}, UTC: ${utcYear}-${utcMonth}-${utcDay}`);
    
    // For DATE columns in PostgreSQL, TypeORM typically uses local timezone
    // So use local components
    return {
      year: localYear,
      month: localMonth,
      day: localDay,
    };
  }

  /**
   * Calculate zodiac sign from birth date
   * Uses tropical zodiac (calendar-based) for horoscope compatibility
   * Note: Swiss Ephemeris uses sidereal zodiac (with ayanamsa), which differs from tropical
   * For horoscope purposes, we use tropical zodiac based on calendar dates
   */
  private async calculateZodiacSign(
    birthDate: Date | string,
    birthTime?: string,
    latitude?: number,
    longitude?: number,
  ): Promise<string> {
    // Extract date components (handles timezone issues)
    const { month, day, year } = this.extractDateComponents(birthDate);
    
    this.logger.debug(`Calculating zodiac sign (tropical) for birth date: ${year}-${month}-${day}`);

    // Always use date-based calculation for horoscope zodiac sign (tropical zodiac)
    // Swiss Ephemeris uses sidereal zodiac which can differ by ~23 degrees
    // Horoscope signs are based on tropical zodiac (calendar dates), not sidereal positions
    this.logger.debug(`Using date-based tropical zodiac calculation for Month=${month}, Day=${day}`);

    // Zodiac sign calculation based on month and day
    // Note: Month is 1-12 (January=1, December=12)
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      this.logger.debug(`Zodiac sign calculated: Aries`);
      return 'Aries';
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      this.logger.debug(`Zodiac sign calculated: Taurus`);
      return 'Taurus';
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      this.logger.debug(`Zodiac sign calculated: Gemini`);
      return 'Gemini';
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      this.logger.debug(`Zodiac sign calculated: Cancer`);
      return 'Cancer';
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return 'Leo';
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return 'Virgo';
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return 'Libra';
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return 'Scorpio';
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return 'Sagittarius';
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      return 'Capricorn';
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return 'Aquarius';
    } else {
      return 'Pisces'; // (month === 2 && day >= 19) || (month === 3 && day <= 20)
    }
  }

  /**
   * Generate horoscope using Swiss Ephemeris
   * Calculates current planetary positions and generates predictions
   */
  private async generateHoroscopeWithSwissEphemeris(sign: string, type: string): Promise<any> {
    try {
      const now = new Date();
      
      // Calculate current planetary positions using Swiss Ephemeris
      // For horoscope, we use current date/time and approximate location (can be improved)
      const kundliData = await this.swissEphemerisService.calculateKundli({
        datetime: now,
        latitude: 28.6139, // Default to Delhi, India (can be made configurable)
        longitude: 77.2090,
        timezone: 'Asia/Kolkata',
      });

      // Get planetary positions
      const sun = kundliData.planets.find((p) => p.name === 'Sun');
      const moon = kundliData.planets.find((p) => p.name === 'Moon');
      const mars = kundliData.planets.find((p) => p.name === 'Mars');
      const venus = kundliData.planets.find((p) => p.name === 'Venus');
      const mercury = kundliData.planets.find((p) => p.name === 'Mercury');
      const jupiter = kundliData.planets.find((p) => p.name === 'Jupiter');
      const saturn = kundliData.planets.find((p) => p.name === 'Saturn');

      // Calculate aspects and transits for the sign
      const signNumber = this.zodiacSigns[sign];
      const signStartDegree = (signNumber - 1) * 30;
      const signEndDegree = signNumber * 30;

      // Determine planetary influences
      const planetaryInfluences = this.calculatePlanetaryInfluences(
        sign,
        sun,
        moon,
        mars,
        venus,
        mercury,
        jupiter,
        saturn,
        signStartDegree,
        signEndDegree,
      );

      // Generate predictions based on planetary positions
      const predictions = this.generatePredictionsFromPlanets(
        sign,
        type,
        planetaryInfluences,
        kundliData,
      );

      return {
        sign,
        type,
        date: now.toISOString().split('T')[0],
        prediction: predictions.general,
        love: predictions.love,
        career: predictions.career,
        health: predictions.health,
        finance: predictions.finance,
        lucky_number: this.calculateLuckyNumber(sun, moon, signNumber),
        lucky_color: this.getLuckyColor(sign),
        compatibility: this.getCompatibility(sign),
        mood: this.calculateMoodFromPlanets(moon, venus),
        planetary_influences: planetaryInfluences,
        nakshatra: kundliData.nakshatra,
        tithi: kundliData.tithi,
      };
    } catch (error) {
      this.logger.error('Swiss Ephemeris horoscope generation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate planetary influences for a sign
   */
  private calculatePlanetaryInfluences(
    sign: string,
    sun: any,
    moon: any,
    mars: any,
    venus: any,
    mercury: any,
    jupiter: any,
    saturn: any,
    signStartDegree: number,
    signEndDegree: number,
  ): Record<string, any> {
    const influences: Record<string, any> = {};

    const planets = [sun, moon, mars, venus, mercury, jupiter, saturn].filter(Boolean);

    planets.forEach((planet) => {
      if (!planet) return;

      const planetLongitude = planet.longitude;
      const isInSign = planetLongitude >= signStartDegree && planetLongitude < signEndDegree;
      const isRetrograde = planet.isRetrograde;

      influences[planet.name.toLowerCase()] = {
        in_sign: isInSign,
        sign: planet.sign,
        house: planet.house,
        is_retrograde: isRetrograde,
        nakshatra: planet.nakshatra,
        influence: this.getPlanetaryInfluence(planet.name, isInSign, isRetrograde),
      };
    });

    return influences;
  }

  /**
   * Get planetary influence description
   */
  private getPlanetaryInfluence(planetName: string, isInSign: boolean, isRetrograde: boolean): string {
    if (isInSign) {
      return isRetrograde
        ? `${planetName} is retrograde in your sign - time for reflection and review`
        : `${planetName} is strong in your sign - favorable period`;
    }
    return `${planetName} influences other areas of your chart`;
  }

  /**
   * Generate predictions from planetary positions
   */
  private generatePredictionsFromPlanets(
    sign: string,
    type: string,
    influences: Record<string, any>,
    kundliData: any,
  ): {
    general: string;
    love: string;
    career: string;
    health: string;
    finance: string;
  } {
    const sunInfluence = influences.sun?.influence || '';
    const moonInfluence = influences.moon?.influence || '';
    const venusInfluence = influences.venus?.influence || '';
    const marsInfluence = influences.mars?.influence || '';
    const jupiterInfluence = influences.jupiter?.influence || '';

    // General prediction based on planetary positions
    const general = this.buildGeneralPrediction(sign, type, influences, kundliData);

    // Love prediction based on Venus and Moon
    const love = this.buildLovePrediction(sign, venusInfluence, moonInfluence, influences);

    // Career prediction based on Sun and Mars
    const career = this.buildCareerPrediction(sign, sunInfluence, marsInfluence, influences);

    // Health prediction based on Moon and overall planetary balance
    const health = this.buildHealthPrediction(sign, moonInfluence, influences);

    // Finance prediction based on Jupiter and Venus
    const finance = this.buildFinancePrediction(sign, jupiterInfluence, venusInfluence, influences);

    return { general, love, career, health, finance };
  }

  /**
   * Build general prediction
   */
  private buildGeneralPrediction(
    sign: string,
    type: string,
    influences: Record<string, any>,
    kundliData: any,
  ): string {
    const period = type === 'daily' ? 'Today' : type === 'weekly' ? 'This week' : 'This month';
    const sunInSign = influences.sun?.in_sign;
    const moonInSign = influences.moon?.in_sign;
    const retrogradePlanets = Object.values(influences).filter((inf: any) => inf.is_retrograde);

    let prediction = `${period} brings `;

    if (sunInSign) {
      prediction += 'strong solar energy and confidence. ';
    } else if (moonInSign) {
      prediction += 'emotional depth and intuition. ';
    } else {
      prediction += 'balanced energy and opportunities. ';
    }

    if (retrogradePlanets.length > 0) {
      prediction += `With ${retrogradePlanets.length} planet(s) retrograde, focus on review and reflection. `;
    }

    prediction += `Your ${sign} nature guides you to `;
    prediction += this.getSignGuidance(sign, type);

    return prediction;
  }

  /**
   * Get sign-specific guidance
   */
  private getSignGuidance(sign: string, type: string): string {
    const guidance: Record<string, Record<string, string>> = {
      daily: {
        Aries: 'take initiative and lead with confidence.',
        Taurus: 'focus on stability and build on existing foundations.',
        Gemini: 'communicate clearly and explore new ideas.',
        Cancer: 'nurture relationships and trust your intuition.',
        Leo: 'shine brightly and express your creativity.',
        Virgo: 'pay attention to details and organize your tasks.',
        Libra: 'seek balance and harmony in all areas.',
        Scorpio: 'embrace transformation and deep connections.',
        Sagittarius: 'explore new horizons and expand your knowledge.',
        Capricorn: 'work diligently toward your long-term goals.',
        Aquarius: 'think innovatively and connect with your community.',
        Pisces: 'trust your intuition and show compassion.',
      },
      weekly: {
        Aries: 'make strategic moves and assert your leadership.',
        Taurus: 'build lasting foundations and maintain stability.',
        Gemini: 'network effectively and share your knowledge.',
        Cancer: 'deepen emotional bonds and create security.',
        Leo: 'showcase your talents and inspire others.',
        Virgo: 'improve systems and enhance efficiency.',
        Libra: 'foster partnerships and create harmony.',
        Scorpio: 'undergo meaningful transformation and growth.',
        Sagittarius: 'embark on new adventures and learn.',
        Capricorn: 'advance your career and build legacy.',
        Aquarius: 'innovate and contribute to collective goals.',
        Pisces: 'connect with your spiritual side and help others.',
      },
      monthly: {
        Aries: 'establish yourself as a leader and pioneer new paths.',
        Taurus: 'create solid foundations and accumulate resources.',
        Gemini: 'expand your network and share knowledge widely.',
        Cancer: 'build deep emotional connections and security.',
        Leo: 'achieve recognition and express your unique self.',
        Virgo: 'perfect your systems and achieve mastery.',
        Libra: 'form meaningful partnerships and create balance.',
        Scorpio: 'experience profound transformation and renewal.',
        Sagittarius: 'explore new territories and expand horizons.',
        Capricorn: 'achieve significant career milestones.',
        Aquarius: 'contribute to innovation and social progress.',
        Pisces: 'deepen spiritual connections and serve others.',
      },
    };

    return guidance[type]?.[sign] || 'follow your inner wisdom and stay true to yourself.';
  }

  /**
   * Build love prediction
   */
  private buildLovePrediction(
    sign: string,
    venusInfluence: string,
    moonInfluence: string,
    influences: Record<string, any>,
  ): string {
    const venusInSign = influences.venus?.in_sign;
    const moonInSign = influences.moon?.in_sign;

    if (venusInSign) {
      return `Venus brings romance and harmony to relationships. ${this.getLovePrediction(sign)}`;
    } else if (moonInSign) {
      return `Emotional connections deepen. ${this.getLovePrediction(sign)}`;
    }
    return this.getLovePrediction(sign);
  }

  /**
   * Build career prediction
   */
  private buildCareerPrediction(
    sign: string,
    sunInfluence: string,
    marsInfluence: string,
    influences: Record<string, any>,
  ): string {
    const sunInSign = influences.sun?.in_sign;
    const marsInSign = influences.mars?.in_sign;

    if (sunInSign) {
      return `Solar energy boosts career confidence. ${this.getCareerPrediction(sign)}`;
    } else if (marsInSign) {
      return `Mars drives ambition and action. ${this.getCareerPrediction(sign)}`;
    }
    return this.getCareerPrediction(sign);
  }

  /**
   * Build health prediction
   */
  private buildHealthPrediction(sign: string, moonInfluence: string, influences: Record<string, any>): string {
    const moonInSign = influences.moon?.in_sign;
    if (moonInSign) {
      return 'Emotional well-being supports physical health. Maintain balance and listen to your body.';
    }
    return this.getHealthPrediction(sign);
  }

  /**
   * Build finance prediction
   */
  private buildFinancePrediction(
    sign: string,
    jupiterInfluence: string,
    venusInfluence: string,
    influences: Record<string, any>,
  ): string {
    const jupiterInSign = influences.jupiter?.in_sign;
    const venusInSign = influences.venus?.in_sign;

    if (jupiterInSign) {
      return 'Jupiter brings expansion and opportunities. Make wise investments and plan for growth.';
    } else if (venusInSign) {
      return 'Venus supports financial harmony. Balance spending and saving wisely.';
    }
    return this.getFinancePrediction(sign);
  }

  /**
   * Calculate lucky number from planetary positions
   */
  private calculateLuckyNumber(sun: any, moon: any, signNumber: number): string {
    if (!sun || !moon) return Math.floor(Math.random() * 100).toString();

    const sunDegree = Math.floor(sun.longitude % 30);
    const moonDegree = Math.floor(moon.longitude % 30);
    const luckyNum = ((sunDegree + moonDegree + signNumber) % 100) + 1;

    return luckyNum.toString();
  }

  /**
   * Calculate mood from planetary positions
   */
  private calculateMoodFromPlanets(moon: any, venus: any): string {
    if (!moon) return 'Balanced';

    const moonSign = moon.sign;
    const isVenusStrong = venus && (venus.sign === moonSign || venus.house === 1);

    if (isVenusStrong) {
      return 'Harmonious';
    }

    const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
    const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
    const airSigns = ['Gemini', 'Libra', 'Aquarius'];
    const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

    if (fireSigns.includes(moonSign)) return 'Energetic';
    if (earthSigns.includes(moonSign)) return 'Grounded';
    if (airSigns.includes(moonSign)) return 'Thoughtful';
    if (waterSigns.includes(moonSign)) return 'Intuitive';

    return 'Balanced';
  }


  /**
   * Generate fallback horoscope (when API is not available)
   */
  private generateFallbackHoroscope(sign: string, type: string): any {
    const predictions = this.getPredictionsByType(type);
    const randomPrediction = predictions[Math.floor(Math.random() * predictions.length)];

    return {
      sign,
      type,
      date: new Date().toISOString().split('T')[0],
      prediction: randomPrediction,
      love: this.getLovePrediction(sign),
      career: this.getCareerPrediction(sign),
      health: this.getHealthPrediction(sign),
      finance: this.getFinancePrediction(sign),
      lucky_number: Math.floor(Math.random() * 100).toString(),
      lucky_color: this.getLuckyColor(sign),
      compatibility: this.getCompatibility(sign),
      mood: this.getMood(sign),
    };
  }

  /**
   * Transform API response to standard format
   */
  private transformHoroscopeResponse(apiData: any, dto: GetHoroscopeDto): HoroscopeResponseDto {
    const data = apiData.data || apiData;

    return {
      sign: dto.sign,
      type: dto.type,
      date: data.date || new Date().toISOString().split('T')[0],
      prediction: data.prediction || data.horoscope || data.description || '',
      love: data.love || data.romance || '',
      career: data.career || data.professional || '',
      health: data.health || '',
      finance: data.finance || data.money || '',
      lucky_number: data.lucky_number || data.luckyNumber || '',
      lucky_color: data.lucky_color || data.luckyColor || '',
      compatibility: data.compatibility || '',
      mood: data.mood || '',
      full_data: data,
    };
  }

  /**
   * Get predictions by type
   */
  private getPredictionsByType(type: string): string[] {
    if (type === 'daily') {
      return [
        'Today brings new opportunities for growth and success. Trust your instincts and take calculated risks.',
        'A day of reflection and planning. Focus on your goals and make steady progress.',
        'Positive energy surrounds you today. Embrace change and be open to new experiences.',
        'Communication is key today. Express your thoughts clearly and listen to others.',
        'A balanced day ahead. Maintain harmony in your relationships and work.',
      ];
    } else if (type === 'weekly') {
      return [
        'This week brings significant changes. Stay adaptable and maintain a positive mindset.',
        'A week of growth and learning. Focus on personal development and new skills.',
        'Relationships take center stage this week. Nurture connections and communicate openly.',
        'Financial opportunities may arise. Make wise decisions and plan for the future.',
        'Health and wellness should be a priority. Take care of your physical and mental well-being.',
      ];
    } else {
      return [
        'This month marks a period of transformation. Embrace change and trust the journey ahead.',
        'A month of opportunities and growth. Stay focused on your long-term goals.',
        'Relationships and partnerships flourish this month. Invest time in meaningful connections.',
        'Financial stability and growth are possible. Make strategic decisions and save wisely.',
        'Health and wellness improvements are on the horizon. Prioritize self-care and balance.',
      ];
    }
  }

  /**
   * Get love prediction for sign
   */
  private getLovePrediction(sign: string): string {
    const predictions: Record<string, string> = {
      Aries: 'Passion and excitement in relationships. Express your feelings openly.',
      Taurus: 'Stability and comfort in love. Focus on building deeper connections.',
      Gemini: 'Communication is key. Share your thoughts and listen to your partner.',
      Cancer: 'Emotional depth and nurturing relationships. Show care and affection.',
      Leo: 'Romance and grand gestures. Make your loved ones feel special.',
      Virgo: 'Practical love and attention to details. Small gestures matter most.',
      Libra: 'Harmony and balance in relationships. Seek compromise and understanding.',
      Scorpio: 'Intense and transformative love. Deep connections are possible.',
      Sagittarius: 'Adventure and freedom in love. Explore new experiences together.',
      Capricorn: 'Commitment and long-term planning. Build a solid foundation.',
      Aquarius: 'Unconventional and unique love. Embrace your individuality.',
      Pisces: 'Compassionate and intuitive love. Trust your feelings and emotions.',
    };
    return predictions[sign] || 'Love and relationships bring joy and fulfillment.';
  }

  /**
   * Get career prediction for sign
   */
  private getCareerPrediction(sign: string): string {
    const predictions: Record<string, string> = {
      Aries: 'Leadership opportunities arise. Take initiative and show confidence.',
      Taurus: 'Steady progress in career. Focus on long-term stability and growth.',
      Gemini: 'Networking and communication skills shine. Build professional relationships.',
      Cancer: 'Emotional intelligence helps in career. Trust your intuition.',
      Leo: 'Recognition and appreciation at work. Your efforts are noticed.',
      Virgo: 'Attention to detail pays off. Focus on quality and precision.',
      Libra: 'Collaboration and teamwork lead to success. Balance work relationships.',
      Scorpio: 'Transformation and growth in career. Embrace change and challenges.',
      Sagittarius: 'New opportunities and expansion. Explore different paths.',
      Capricorn: 'Hard work and dedication bring rewards. Stay focused on goals.',
      Aquarius: 'Innovation and creativity in work. Think outside the box.',
      Pisces: 'Intuition guides career decisions. Trust your inner wisdom.',
    };
    return predictions[sign] || 'Career opportunities and professional growth are on the horizon.';
  }

  /**
   * Get health prediction for sign
   */
  private getHealthPrediction(sign: string): string {
    return 'Maintain a balanced lifestyle. Regular exercise, proper nutrition, and adequate rest are essential for your well-being.';
  }

  /**
   * Get finance prediction for sign
   */
  private getFinancePrediction(sign: string): string {
    return 'Financial stability is possible with careful planning. Avoid impulsive spending and focus on long-term investments.';
  }

  /**
   * Get lucky color for sign
   */
  private getLuckyColor(sign: string): string {
    const colors: Record<string, string> = {
      Aries: 'Red',
      Taurus: 'Green',
      Gemini: 'Yellow',
      Cancer: 'Silver',
      Leo: 'Gold',
      Virgo: 'Brown',
      Libra: 'Pink',
      Scorpio: 'Maroon',
      Sagittarius: 'Purple',
      Capricorn: 'Black',
      Aquarius: 'Blue',
      Pisces: 'Sea Green',
    };
    return colors[sign] || 'White';
  }

  /**
   * Get compatibility for sign
   */
  private getCompatibility(sign: string): string {
    const compatibilities: Record<string, string> = {
      Aries: 'Best with Leo, Sagittarius',
      Taurus: 'Best with Virgo, Capricorn',
      Gemini: 'Best with Libra, Aquarius',
      Cancer: 'Best with Scorpio, Pisces',
      Leo: 'Best with Aries, Sagittarius',
      Virgo: 'Best with Taurus, Capricorn',
      Libra: 'Best with Gemini, Aquarius',
      Scorpio: 'Best with Cancer, Pisces',
      Sagittarius: 'Best with Aries, Leo',
      Capricorn: 'Best with Taurus, Virgo',
      Aquarius: 'Best with Gemini, Libra',
      Pisces: 'Best with Cancer, Scorpio',
    };
    return compatibilities[sign] || 'Compatible with all signs';
  }

  /**
   * Get mood for sign
   */
  private getMood(sign: string): string {
    const moods = ['Optimistic', 'Calm', 'Energetic', 'Reflective', 'Confident', 'Balanced'];
    return moods[Math.floor(Math.random() * moods.length)];
  }
}

