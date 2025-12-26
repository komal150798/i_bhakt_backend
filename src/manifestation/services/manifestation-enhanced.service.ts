import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manifestation } from '../entities/manifestation.entity';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import { ManifestationAIEvaluationService } from './manifestation-ai-evaluation.service';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../users/entities/customer.entity';
import { SwissEphemerisService } from '../../astrology/services/swiss-ephemeris.service';
import { DashaRecord } from '../../database/entities/dasha-record.entity';
import { AntardashaRecord } from '../../database/entities/antardasha-record.entity';
import { PratyantarDashaRecord } from '../../database/entities/pratyantar-dasha-record.entity';
import { SukshmaDashaRecord } from '../../database/entities/sukshma-dasha-record.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { KundliPlanet } from '../../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../../kundli/entities/kundli-house.entity';
import { KundliService } from '../../kundli/services/kundli.service';

@Injectable()
export class ManifestationEnhancedService {
  private readonly logger = new Logger(ManifestationEnhancedService.name);

  constructor(
    @InjectRepository(Manifestation)
    private manifestationRepository: Repository<Manifestation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(DashaRecord)
    private dashaRepository: Repository<DashaRecord>,
    @InjectRepository(AntardashaRecord)
    private antardashaRepository: Repository<AntardashaRecord>,
    @InjectRepository(PratyantarDashaRecord)
    private pratyantarRepository: Repository<PratyantarDashaRecord>,
    @InjectRepository(SukshmaDashaRecord)
    private sukshmaRepository: Repository<SukshmaDashaRecord>,
    @InjectRepository(Kundli)
    private kundliRepository: Repository<Kundli>,
    @InjectRepository(KundliPlanet)
    private kundliPlanetRepository: Repository<KundliPlanet>,
    @InjectRepository(KundliHouse)
    private kundliHouseRepository: Repository<KundliHouse>,
    private aiEvaluationService: ManifestationAIEvaluationService,
    private swissEphemerisService: SwissEphemerisService,
    private kundliService: KundliService,
  ) {}

  /**
   * Create a new manifestation with AI evaluation
   */
  async createManifestation(
    userId: number,
    dto: CreateManifestationEnhancedDto,
  ): Promise<Manifestation> {
    // Validate description length (15 characters min)
    if (dto.description.trim().length < 15) {
      throw new BadRequestException(
        'Description must be at least 15 characters long. Please provide more details about your manifestation intent.',
      );
    }

    // Auto-generate title from description if not provided
    let title = dto.title?.trim();
    if (!title || title.length === 0) {
      // Generate title from first sentence or first 50 characters of description
      const description = dto.description.trim();
      const firstSentence = description.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 0 && firstSentence.length <= 200) {
        title = firstSentence;
      } else {
        // Fallback: use first 50 characters
        title = description.substring(0, 50).trim();
        if (title.length < description.length) {
          title += '...';
        }
      }
      // Ensure title is not too long
      if (title.length > 200) {
        title = title.substring(0, 197) + '...';
      }
    }

    // Get user - check Customer table first (new normalized structure), then fallback to User table
    let user: User | Customer | null = null;
    
    // Try Customer table first
    user = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
    
    // Fallback to legacy User table
    if (!user) {
      user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
    }
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Run AI + Swiss Ephemeris evaluation (category will be auto-detected from description)
    // Pass user as User type (both Customer and User have compatible fields for this)
    const evaluation = await this.aiEvaluationService.evaluateManifestation(
      title,
      dto.description,
      dto.category,
      user as User,
    );

    // Use detected category if not provided in DTO
    const finalCategory = dto.category || evaluation.detectedCategory || null;

    // Calculate Recommended Action Windows (optimal dates based on astrological influences)
    const actionWindows = await this.calculateActionWindows(finalCategory, user as User);

    // Create manifestation entity
    const manifestation = this.manifestationRepository.create({
      user_id: userId,
      title: title,
      description: dto.description.trim(),
      category: finalCategory,
      emotional_state: null, // Auto-detected from content, not user input
      target_date: null, // Removed from form
      resonance_score: evaluation.scores.resonance_score,
      alignment_score: evaluation.scores.alignment_score,
      antrashaakti_score: evaluation.scores.antrashaakti_score,
      mahaadha_score: evaluation.scores.mahaadha_score,
      astro_support_index: evaluation.scores.astro_support_index,
      mfp_score: evaluation.scores.mfp_score,
      coherence_score: evaluation.scores.coherence_score,
      action_windows: actionWindows,
      progress_tracking: {
        current_progress: 0,
        journal_entries_count: 0,
        milestones: [],
      },
      tips: evaluation.tips,
      insights: evaluation.insights,
      is_archived: false,
    });

    return await this.manifestationRepository.save(manifestation);
  }

  /**
   * Get dashboard data for user
   * Dashboard calculations use ONLY locked manifestations
   */
  async getDashboard(userId: number): Promise<{
    summary: {
      top_resonance: number;
      alignment_score: number;
      astro_support: number;
      energy_state: 'aligned' | 'unstable' | 'blocked';
    };
    manifestations: Array<{
      id: number;
      title: string;
      description: string;
      resonance_score: number | null;
      alignment_score: number | null;
      coherence_score: number | null;
      mfp_score: number | null;
      astro_support_index: number | null;
      is_archived: boolean;
      is_locked: boolean;
      added_date: Date;
      category: string | null;
      category_label: string | null;
      action_windows: any;
      progress_tracking: any;
    }>;
  }> {
    // Get active manifestations - sorted by creation date (oldest first)
    const activeManifestations = await this.manifestationRepository.find({
      where: {
        user_id: userId,
        is_archived: false,
        is_deleted: false,
      },
      order: { added_date: 'ASC' },
    });

    // Get LOCKED manifestations for dashboard calculations
    const lockedManifestations = activeManifestations.filter(m => m.is_locked === true);
    
    this.logger.debug(`Total active manifestations: ${activeManifestations.length}`);
    this.logger.debug(`Locked manifestations: ${lockedManifestations.length}`);
    if (lockedManifestations.length > 0) {
      this.logger.debug(`Locked manifestation IDs: ${lockedManifestations.map(m => m.id).join(', ')}`);
      this.logger.debug(`Locked manifestation scores:`, lockedManifestations.map(m => ({
        id: m.id,
        resonance: m.resonance_score,
        alignment: m.alignment_score,
        astro: m.astro_support_index,
      })));
    }

    // Calculate summary from LOCKED manifestations only
    let top_resonance: number = 0;
    let alignment_score: number = 0;
    let astro_support: number = 0;
    let energy_state: 'aligned' | 'unstable' | 'blocked' = 'aligned';

    if (lockedManifestations.length > 0) {
      // Calculate average scores from all locked manifestations
      // Convert string/decimal values to numbers properly
      const totalResonance = lockedManifestations.reduce((sum, m) => {
        let score: number = 0;
        if (m.resonance_score !== null && m.resonance_score !== undefined) {
          score = typeof m.resonance_score === 'string' 
            ? parseFloat(m.resonance_score) 
            : Number(m.resonance_score);
          if (isNaN(score)) score = 0;
        }
        return sum + score;
      }, 0);
      
      const totalAlignment = lockedManifestations.reduce((sum, m) => {
        let score: number = 0;
        if (m.alignment_score !== null && m.alignment_score !== undefined) {
          score = typeof m.alignment_score === 'string' 
            ? parseFloat(m.alignment_score) 
            : Number(m.alignment_score);
          if (isNaN(score)) score = 0;
        }
        return sum + score;
      }, 0);
      
      const totalAstro = lockedManifestations.reduce((sum, m) => {
        let score: number = 0;
        if (m.astro_support_index !== null && m.astro_support_index !== undefined) {
          score = typeof m.astro_support_index === 'string' 
            ? parseFloat(m.astro_support_index) 
            : Number(m.astro_support_index);
          if (isNaN(score)) score = 0;
        }
        return sum + score;
      }, 0);
      
      // Calculate averages (always calculate, even if 0)
      top_resonance = Math.round((totalResonance / lockedManifestations.length) * 100) / 100;
      alignment_score = Math.round((totalAlignment / lockedManifestations.length) * 100) / 100;
      astro_support = Math.round((totalAstro / lockedManifestations.length) * 100) / 100;
      
      // Ensure values are numbers, not null or NaN
      top_resonance = (isNaN(top_resonance) || top_resonance === null || top_resonance === undefined) ? 0 : top_resonance;
      alignment_score = (isNaN(alignment_score) || alignment_score === null || alignment_score === undefined) ? 0 : alignment_score;
      astro_support = (isNaN(astro_support) || astro_support === null || astro_support === undefined) ? 0 : astro_support;
      
      // Get energy state from the most recent locked manifestation
      const mostRecentLocked = lockedManifestations[lockedManifestations.length - 1];
      energy_state = mostRecentLocked.insights?.energy_state || 'aligned';
      
      // Debug logging
      this.logger.debug(`Dashboard calculation: ${lockedManifestations.length} locked manifestations`);
      this.logger.debug(`Calculated scores: resonance=${top_resonance}, alignment=${alignment_score}, astro=${astro_support}`);
    } else if (activeManifestations.length > 0) {
      // Fallback: if no locked manifestations, use the first active one (for backward compatibility)
      const topManifestation = activeManifestations[0];
      top_resonance = topManifestation.resonance_score !== null && topManifestation.resonance_score !== undefined
        ? (typeof topManifestation.resonance_score === 'string' 
          ? parseFloat(topManifestation.resonance_score) || 0
          : Number(topManifestation.resonance_score) || 0)
        : 0;
      alignment_score = topManifestation.alignment_score !== null && topManifestation.alignment_score !== undefined
        ? (typeof topManifestation.alignment_score === 'string' 
          ? parseFloat(topManifestation.alignment_score) || 0
          : Number(topManifestation.alignment_score) || 0)
        : 0;
      astro_support = topManifestation.astro_support_index !== null && topManifestation.astro_support_index !== undefined
        ? (typeof topManifestation.astro_support_index === 'string' 
          ? parseFloat(topManifestation.astro_support_index) || 0
          : Number(topManifestation.astro_support_index) || 0)
        : 0;
      energy_state = topManifestation.insights?.energy_state || 'aligned';
    }

    // Ensure summary values are never null - convert to numbers explicitly
    const summary = {
      top_resonance: top_resonance !== null && top_resonance !== undefined && !isNaN(top_resonance) ? Number(top_resonance) : 0,
      alignment_score: alignment_score !== null && alignment_score !== undefined && !isNaN(alignment_score) ? Number(alignment_score) : 0,
      astro_support: astro_support !== null && astro_support !== undefined && !isNaN(astro_support) ? Number(astro_support) : 0,
      energy_state: energy_state || 'aligned',
    };

    this.logger.debug(`Dashboard summary calculated:`, JSON.stringify(summary));
    this.logger.debug(`Locked manifestations count: ${lockedManifestations.length}`);

    return {
      summary,
      manifestations: activeManifestations.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        resonance_score: typeof m.resonance_score === 'string' 
          ? parseFloat(m.resonance_score) 
          : (m.resonance_score || null),
        alignment_score: typeof m.alignment_score === 'string' 
          ? parseFloat(m.alignment_score) 
          : (m.alignment_score || null),
        coherence_score: typeof m.coherence_score === 'string' 
          ? parseFloat(m.coherence_score) 
          : (m.coherence_score || null),
        mfp_score: typeof m.mfp_score === 'string' 
          ? parseFloat(m.mfp_score) 
          : (m.mfp_score || null),
        astro_support_index: typeof m.astro_support_index === 'string' 
          ? parseFloat(m.astro_support_index) 
          : (m.astro_support_index || null),
        is_archived: m.is_archived,
        is_locked: m.is_locked,
        added_date: m.added_date,
        category: m.category,
        category_label: m.category, // Will be populated from category lookup if needed
        action_windows: m.action_windows,
        progress_tracking: m.progress_tracking,
      })),
    };
  }

  /**
   * Get manifestation by ID with full details
   */
  async getManifestationById(id: number, userId: number): Promise<Manifestation> {
    const manifestation = await this.manifestationRepository.findOne({
      where: { id, user_id: userId, is_deleted: false },
    });

    if (!manifestation) {
      throw new NotFoundException('Manifestation not found');
    }

    return manifestation;
  }

  /**
   * Archive a manifestation
   */
  async archiveManifestation(id: number, userId: number): Promise<Manifestation> {
    const manifestation = await this.manifestationRepository.findOne({
      where: { id, user_id: userId, is_deleted: false },
    });

    if (!manifestation) {
      throw new NotFoundException('Manifestation not found');
    }

    manifestation.is_archived = true;
    return await this.manifestationRepository.save(manifestation);
  }

  /**
   * Lock/Unlock a manifestation
   * Locked manifestations are used for dashboard calculations
   */
  async toggleLockManifestation(id: number, userId: number): Promise<Manifestation> {
    const manifestation = await this.manifestationRepository.findOne({
      where: { id, user_id: userId, is_deleted: false },
    });

    if (!manifestation) {
      throw new NotFoundException('Manifestation not found');
    }

    manifestation.is_locked = !manifestation.is_locked;
    return await this.manifestationRepository.save(manifestation);
  }

  /**
   * Get tips/rituals for a manifestation
   */
  async getTips(id: number, userId: number): Promise<{
    tips: {
      rituals?: string[];
      what_to_manifest?: string[];
      what_not_to_manifest?: string[];
      thought_alignment?: string[];
      daily_actions?: string[];
    };
  }> {
    const manifestation = await this.manifestationRepository.findOne({
      where: { id, user_id: userId, is_deleted: false },
    });

    if (!manifestation) {
      throw new NotFoundException('Manifestation not found');
    }

    return {
      tips: manifestation.tips || {
        rituals: [],
        what_to_manifest: [],
        what_not_to_manifest: [],
        thought_alignment: [],
        daily_actions: [],
      },
    };
  }

  /**
   * Calculate Recommended Action Windows based on astrological influences
   * Returns optimal dates for taking action on the manifestation
   */
  private async calculateActionWindows(
    category: string | null,
    user: User | null,
  ): Promise<{
    optimal_dates: string[];
    next_optimal_date: string | null;
    planetary_influences: Array<{
      date: string;
      planet: string;
      influence: 'positive' | 'neutral' | 'negative';
      description: string;
    }>;
  }> {
    const optimalDates: string[] = [];
    const planetaryInfluences: Array<{
      date: string;
      planet: string;
      influence: 'positive' | 'neutral' | 'negative';
      description: string;
    }> = [];

    const today = new Date();
    const next30Days: Date[] = [];

    // Generate dates for next 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      next30Days.push(date);
    }

    // Category-specific planetary influences
    const categoryPlanets: Record<string, { primary: string; secondary: string }> = {
      relationship: { primary: 'Venus', secondary: 'Jupiter' },
      love: { primary: 'Venus', secondary: 'Jupiter' },
      career: { primary: 'Mercury', secondary: 'Jupiter' },
      wealth: { primary: 'Jupiter', secondary: 'Venus' },
      money: { primary: 'Jupiter', secondary: 'Venus' },
      health: { primary: 'Mars', secondary: 'Sun' },
      spiritual: { primary: 'Jupiter', secondary: 'Ketu' },
      spirituality: { primary: 'Jupiter', secondary: 'Ketu' },
    };

    const planets = category && categoryPlanets[category.toLowerCase()]
      ? [categoryPlanets[category.toLowerCase()].primary, categoryPlanets[category.toLowerCase()].secondary]
      : ['Jupiter', 'Venus']; // Default beneficial planets

    // Calculate optimal dates based on moon phases and planetary positions
    for (const date of next30Days) {
      try {
        // Use Swiss Ephemeris to calculate planetary positions for this date
        const kundliData = await this.swissEphemerisService.calculateKundli({
          datetime: date,
          latitude: user?.latitude || 28.6139, // Default to Delhi if not available
          longitude: user?.longitude || 77.2090,
          timezone: 'Asia/Kolkata',
        });

        // Check planetary influences
        let positiveInfluence = 0;
        let planetInfluence: { planet: string; influence: 'positive' | 'neutral' | 'negative'; description: string } | null = null;

        for (const planetName of planets) {
          const planet = kundliData.planets.find((p) => p.name === planetName);
          if (planet) {
            // Check if planet is in favorable sign or nakshatra
            const favorableSigns: Record<string, string[]> = {
              Venus: ['Taurus', 'Libra', 'Pisces'],
              Jupiter: ['Sagittarius', 'Pisces', 'Cancer'],
              Mercury: ['Gemini', 'Virgo'],
              Mars: ['Aries', 'Scorpio', 'Capricorn'],
              Sun: ['Leo', 'Aries'],
            };

            if (favorableSigns[planetName]?.includes(planet.sign)) {
              positiveInfluence += 2;
              planetInfluence = {
                planet: planetName,
                influence: 'positive',
                description: `${planetName} is in favorable sign ${planet.sign}`,
              };
            } else {
              positiveInfluence += 1;
              if (!planetInfluence) {
                planetInfluence = {
                  planet: planetName,
                  influence: 'neutral',
                  description: `${planetName} is in ${planet.sign}`,
                };
              }
            }
          }
        }

        // Check moon phase (new moon and full moon are powerful for manifestation)
        const moon = kundliData.planets.find((p) => p.name === 'Moon');
        if (moon) {
          // Simplified moon phase calculation
          const moonPhase = (moon.longitude % 360) / 360;
          if (moonPhase < 0.1 || moonPhase > 0.9) {
            // New moon or full moon
            positiveInfluence += 3;
            if (planetInfluence) {
              planetInfluence.influence = 'positive';
              planetInfluence.description += ` + Powerful Moon phase`;
            }
          }
        }

        // If positive influence is high, add to optimal dates
        if (positiveInfluence >= 4) {
          optimalDates.push(date.toISOString().split('T')[0]);
          if (planetInfluence) {
            planetaryInfluences.push({
              date: date.toISOString().split('T')[0],
              ...planetInfluence,
            });
          }
        }
      } catch (error) {
        // If calculation fails, skip this date
        continue;
      }
    }

    // Limit to top 5 optimal dates
    const topOptimalDates = optimalDates.slice(0, 5);

    return {
      optimal_dates: topOptimalDates,
      next_optimal_date: topOptimalDates.length > 0 ? topOptimalDates[0] : null,
      planetary_influences: planetaryInfluences.slice(0, 5),
    };
  }

  /**
   * Get all manifestations (active and archived)
   */
  async getAllManifestations(
    userId: number,
    includeArchived: boolean = false,
  ): Promise<Manifestation[]> {
    const where: any = {
      user_id: userId,
      is_deleted: false,
    };

    if (!includeArchived) {
      where.is_archived = false;
    }

    return await this.manifestationRepository.find({
      where,
      order: { added_date: 'DESC' },
    });
  }

  /**
   * Ensure kundli exists for user, calculate and store if not
   */
  private async ensureKundliExists(user: User | Customer): Promise<void> {
    try {
      // Check if kundli exists
      const existingKundli = await this.kundliRepository.findOne({
        where: { user_id: user.id, is_deleted: false },
      });

      if (existingKundli) {
        this.logger.debug(`Kundli already exists for user ${user.id}`);
        return;
      }

      // Check if user has birth data
      const birthDate = (user as any).date_of_birth || (user as any).birth_date;
      const birthTime = (user as any).time_of_birth || (user as any).birth_time;
      const latitude = (user as any).latitude;
      const longitude = (user as any).longitude;
      const placeName = (user as any).place_name || (user as any).birth_place;

      if (!birthDate || !birthTime || !latitude || !longitude) {
        this.logger.warn(`User ${user.id} missing birth data for kundli calculation`);
        return;
      }

      // Calculate and store kundli
      this.logger.log(`Calculating kundli for user ${user.id}`);
      const firstName = (user as any).first_name || 'User';
      const lastName = (user as any).last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      await this.kundliService.generateKundli(
        {
          name: fullName,
          birth_date: birthDate instanceof Date ? birthDate.toISOString().split('T')[0] : birthDate,
          birth_time: birthTime,
          birth_place: placeName || 'Unknown',
          latitude,
          longitude,
          timezone: (user as any).timezone || 'Asia/Kolkata',
        },
        user.id,
      );
    } catch (error) {
      this.logger.error(`Failed to ensure kundli exists for user ${user.id}:`, error);
      // Continue without kundli - will use fallback
    }
  }

  /**
   * Calculate Vimshottari Dasha periods from nakshatra and birth date
   */
  private async calculateAndStoreDashaPeriods(userId: number, user: User | Customer): Promise<void> {
    try {
      // Check if Dasha records already exist
      const existingDasha = await this.dashaRepository.findOne({
        where: { user_id: userId },
      });

      if (existingDasha) {
        this.logger.debug(`Dasha periods already exist for user ${userId}`);
        return;
      }

      // Get user's nakshatra and birth data
      const nakshatra = (user as any).nakshatra;
      const dashaAtBirth = (user as any).dasha_at_birth;
      const birthDate = (user as any).date_of_birth || (user as any).birth_date;

      if (!nakshatra || !dashaAtBirth || !birthDate) {
        this.logger.warn(`User ${userId} missing nakshatra or birth data for Dasha calculation`);
        return;
      }

      // Vimshottari Dasha sequence (120 years total)
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

      // Find starting position in sequence
      const startIndex = dashaSequence.indexOf(dashaAtBirth);
      if (startIndex === -1) {
        this.logger.warn(`Invalid dasha_at_birth: ${dashaAtBirth}, using Moon as default`);
        // Default to Moon if invalid
        const moonIndex = dashaSequence.indexOf('Moon');
        if (moonIndex === -1) return;
        // Will use Moon index below
      }

      const birthDateTime = new Date(birthDate);
      if ((user as any).time_of_birth) {
        const timeStr = (user as any).time_of_birth;
        if (timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':');
          birthDateTime.setHours(parseInt(hours) || 12, parseInt(minutes) || 0, 0, 0);
        }
      } else {
        birthDateTime.setHours(12, 0, 0, 0); // Default to noon if no time
      }

      // Calculate Mahadasha periods (starting from birth)
      // Use the actual startIndex (or Moon if invalid was provided)
      const actualStartIndex = startIndex !== -1 ? startIndex : dashaSequence.indexOf('Moon');
      let currentDate = new Date(birthDateTime);
      const mahadashas: Array<{ lord: string; start: Date; end: Date; duration: number }> = [];

      // Calculate next 3-4 Mahadashas (enough to cover current and future periods)
      for (let i = 0; i < 4; i++) {
        const lordIndex = (actualStartIndex + i) % 9;
        const lord = dashaSequence[lordIndex];
        const duration = dashaDurations[lord];
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        // Add years properly accounting for leap years
        end.setTime(end.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);

        mahadashas.push({ lord, start, end, duration });
        currentDate = new Date(end);
      }

      // Store Mahadasha and calculate sub-periods
      for (const maha of mahadashas) {
        const mahaRecord = this.dashaRepository.create({
          user_id: userId,
          mahadasha_lord: maha.lord,
          start_date: maha.start,
          end_date: maha.end,
          duration_years: maha.duration,
        });
        const savedMaha = await this.dashaRepository.save(mahaRecord);

        // Calculate Antardasha (sub-periods of Mahadasha)
        const antaraSequence = dashaSequence;
        const antaraStartIndex = dashaSequence.indexOf(maha.lord);
        let antaraCurrentDate = new Date(maha.start);

        for (let j = 0; j < 9; j++) {
          const antaraLordIndex = (antaraStartIndex + j) % 9;
          const antaraLord = antaraSequence[antaraLordIndex];
          const antaraDuration = (dashaDurations[antaraLord] / 120) * maha.duration;
          const antaraStart = new Date(antaraCurrentDate);
          const antaraEnd = new Date(antaraCurrentDate);
          // Add years properly accounting for leap years
          antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);

          if (antaraEnd > maha.end) {
            antaraEnd.setTime(maha.end.getTime());
          }

          const antaraRecord = this.antardashaRepository.create({
            dasha_record_id: savedMaha.id,
            antardasha_lord: antaraLord,
            start_date: antaraStart,
            end_date: antaraEnd,
            duration_years: antaraDuration,
          });
          const savedAntara = await this.antardashaRepository.save(antaraRecord);

          // Calculate Pratyantar (sub-periods of Antardasha)
          const pratyantarStartIndex = dashaSequence.indexOf(antaraLord);
          let pratyantarCurrentDate = new Date(antaraStart);

          for (let k = 0; k < 9; k++) {
            const pratyantarLordIndex = (pratyantarStartIndex + k) % 9;
            const pratyantarLord = antaraSequence[pratyantarLordIndex];
            const pratyantarDuration = (dashaDurations[pratyantarLord] / 120) * antaraDuration;
            const pratyantarStart = new Date(pratyantarCurrentDate);
            const pratyantarEnd = new Date(pratyantarCurrentDate);
            // Add years properly accounting for leap years
            pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);

            if (pratyantarEnd > antaraEnd) {
              pratyantarEnd.setTime(antaraEnd.getTime());
            }

            const pratyantarRecord = this.pratyantarRepository.create({
              antardasha_record_id: savedAntara.id,
              pratyantar_lord: pratyantarLord,
              start_date: pratyantarStart,
              end_date: pratyantarEnd,
              duration_years: pratyantarDuration,
            });
            const savedPratyantar = await this.pratyantarRepository.save(pratyantarRecord);

            // Calculate Sukshma (sub-periods of Pratyantar)
            const sukshmaStartIndex = dashaSequence.indexOf(pratyantarLord);
            let sukshmaCurrentDate = new Date(pratyantarStart);

            for (let l = 0; l < 9; l++) {
              const sukshmaLordIndex = (sukshmaStartIndex + l) % 9;
              const sukshmaLord = antaraSequence[sukshmaLordIndex];
              const sukshmaDuration = (dashaDurations[sukshmaLord] / 120) * pratyantarDuration;
              const sukshmaStart = new Date(sukshmaCurrentDate);
              const sukshmaEnd = new Date(sukshmaCurrentDate);
              // Add years properly accounting for leap years
              sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);

              if (sukshmaEnd > pratyantarEnd) {
                sukshmaEnd.setTime(pratyantarEnd.getTime());
              }

              const sukshmaRecord = this.sukshmaRepository.create({
                pratyantar_dasha_record_id: savedPratyantar.id,
                sukshma_lord: sukshmaLord,
                start_date: sukshmaStart,
                end_date: sukshmaEnd,
                duration_years: sukshmaDuration,
              });
              await this.sukshmaRepository.save(sukshmaRecord);

              sukshmaCurrentDate = new Date(sukshmaEnd);
              if (sukshmaCurrentDate >= pratyantarEnd) break;
            }

            pratyantarCurrentDate = new Date(pratyantarEnd);
            if (pratyantarCurrentDate >= antaraEnd) break;
          }

          antaraCurrentDate = new Date(antaraEnd);
          if (antaraCurrentDate >= maha.end) break;
        }
      }

      this.logger.log(`Dasha periods calculated and stored for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to calculate Dasha periods for user ${userId}:`, error);
      // Continue without Dasha data
    }
  }

  /**
   * Calculate detailed resonance score with Dasha analysis
   * Returns comprehensive analysis including supportive/challenging factors and Dasha resonance
   */
  async calculateDetailedResonance(
    userId: number,
    description: string,
  ): Promise<{
    resonance_score: number;
    category: string;
    category_label: string;
    manifestation_class: string;
    manifestation_class_label: string;
    supportive_factors: Array<{
      type: string;
      description: string;
      score: number;
      weightage: number;
      period?: string;
    }>;
    challenging_factors: Array<{
      type: string;
      description: string;
      impact: number;
      weightage: number;
    }>;
    dasha_resonance: {
      mahadasha: {
        lord: string;
        supportive: number;
        challenging: number;
        period: string;
      };
      antardasha: {
        lord: string;
        supportive: number;
        challenging: number;
        period: string;
      };
      pratyantar: {
        lord: string;
        supportive: number;
        challenging: number;
        period: string;
      };
      sukshma: {
        lord: string;
        supportive: number;
        challenging: number;
        period: string;
      };
    };
    tips: any;
    insights: any;
  }> {
    // Get user
    let user: User | Customer | null = null;
    user = await this.customerRepository.findOne({ where: { id: userId, is_deleted: false } });
    if (!user) {
      user = await this.userRepository.findOne({ where: { id: userId, is_deleted: false } });
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure kundli exists (calculate and store if not)
    await this.ensureKundliExists(user);

    // Auto-generate title from description
    const firstSentence = description.split(/[.!?]/)[0].trim();
    const title = firstSentence.length > 0 && firstSentence.length <= 200
      ? firstSentence
      : description.substring(0, 50).trim() + (description.length > 50 ? '...' : '');

    // Run AI evaluation
    const evaluation = await this.aiEvaluationService.evaluateManifestation(
      title,
      description,
      null,
      user as User,
    );

    const resonanceScore = evaluation.scores.resonance_score;
    const category = evaluation.detectedCategory || 'other';
    const categoryLabel = evaluation.insights?.category_label || category;

    // Get kundli data with dasha_timeline and planetary positions
    const kundli = await this.kundliRepository.findOne({
      where: { user_id: userId, is_deleted: false },
    });
    
    // Get planetary positions from kundli_planets table
    let planets: KundliPlanet[] = [];
    let houses: KundliHouse[] = [];
    
    if (kundli) {
      try {
        planets = await this.kundliPlanetRepository.find({
          where: { kundli_id: kundli.id, is_deleted: false },
        });
        houses = await this.kundliHouseRepository.find({
          where: { kundli_id: kundli.id, is_deleted: false },
        });
        this.logger.debug(`Found ${planets.length} planets and ${houses.length} houses for kundli ${kundli.id}`);
      } catch (error) {
        this.logger.warn('Could not fetch planets/houses, continuing without them:', error.message);
      }
    }

    // Get current Dasha periods from kundli's dasha_timeline
    const currentDate = new Date();
    let currentMahadasha: any = null;
    let currentAntardasha: any = null;
    let currentPratyantar: any = null;
    let currentSukshma: any = null;

    if (kundli) {
      this.logger.debug(`Kundli found for user ${userId}, nakshatra: ${kundli.nakshatra}, dasha_timeline exists: ${!!kundli.dasha_timeline}`);
      
      // Try to get dasha from dasha_timeline
      let dashaData: any = null;
      
      if (kundli.dasha_timeline) {
        this.logger.debug(`dasha_timeline type: ${typeof kundli.dasha_timeline}, isArray: ${Array.isArray(kundli.dasha_timeline)}`);
        
        // Check if it's the nested structure from calculateVimshottariDasha
        // dasha_timeline can be an array OR an object with vimshottari property
        const dashaTimeline = kundli.dasha_timeline as any;
        
        if (!Array.isArray(dashaTimeline) && dashaTimeline.vimshottari && dashaTimeline.vimshottari.mahadasha) {
          this.logger.debug('Using nested vimshottari structure');
          // Extract the mahadasha array from nested structure
          const mahadashas = dashaTimeline.vimshottari.mahadasha;
          const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
          dashaData = this.calculateCurrentDashaFromTimeline(mahadashas, currentDate, birthDate);
        } else if (Array.isArray(dashaTimeline)) {
          this.logger.debug('Using direct array format');
          // Direct array format
          const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
          dashaData = this.calculateCurrentDashaFromTimeline(dashaTimeline, currentDate, birthDate);
        } else {
          this.logger.warn(`Unexpected dasha_timeline format: ${typeof dashaTimeline}`);
        }
      }
      
      // If dasha_timeline doesn't work, calculate from birth date and nakshatra
      if (!dashaData && kundli.nakshatra) {
        this.logger.log(`Calculating dasha from birth date (${kundli.birth_date}) and nakshatra (${kundli.nakshatra})`);
        const birthDate = kundli.birth_date instanceof Date ? kundli.birth_date : new Date(kundli.birth_date);
        const birthTime = kundli.birth_time ? `${kundli.birth_date}T${kundli.birth_time}` : kundli.birth_date;
        const birthDateTime = new Date(birthTime);
        dashaData = this.calculateDashaFromBirthDateAndNakshatra(
          birthDateTime,
          kundli.nakshatra,
          currentDate,
        );
      }
      
      if (dashaData) {
        currentMahadasha = dashaData.mahadasha;
        currentAntardasha = dashaData.antardasha;
        currentPratyantar = dashaData.pratyantar;
        currentSukshma = dashaData.sukshma;
        
        this.logger.log(`Current Dasha calculated: Mahadasha=${currentMahadasha?.lord || 'Unknown'}, Antardasha=${currentAntardasha?.lord || 'Unknown'}`);
      } else {
        this.logger.warn(`Could not calculate dasha from kundli data. Nakshatra: ${kundli.nakshatra}, Birth date: ${kundli.birth_date}`);
      }
    } else {
      this.logger.warn(`No kundli found for user ${userId}`);
    }
    
    // Fallback: Try dasha_records table if still no dasha found
    if (!currentMahadasha) {
      // Fallback: Try dasha_records table
      this.logger.warn('No dasha_timeline in kundli, trying dasha_records table');
      try {
        const dashaRecords = await this.dashaRepository.find({
          where: { user_id: userId },
          relations: ['antardashas', 'antardashas.pratyantardashas', 'antardashas.pratyantardashas.sukshmadashas'],
          order: { start_date: 'ASC' },
        });

        for (const dasha of dashaRecords) {
          if (new Date(dasha.start_date) <= currentDate && new Date(dasha.end_date) >= currentDate) {
            currentMahadasha = dasha;
            for (const antara of dasha.antardashas || []) {
              if (new Date(antara.start_date) <= currentDate && new Date(antara.end_date) >= currentDate) {
                currentAntardasha = antara;
                for (const pratyantar of antara.pratyantardashas || []) {
                  if (new Date(pratyantar.start_date) <= currentDate && new Date(pratyantar.end_date) >= currentDate) {
                    currentPratyantar = pratyantar;
                    for (const sukshma of pratyantar.sukshmadashas || []) {
                      if (new Date(sukshma.start_date) <= currentDate && new Date(sukshma.end_date) >= currentDate) {
                        currentSukshma = sukshma;
                        break;
                      }
                    }
                    break;
                  }
                }
                break;
              }
            }
            break;
          }
        }
      } catch (error) {
        this.logger.warn('Could not fetch Dasha records:', error.message);
      }
    }

    // Calculate Dasha resonance scores based on category alignment and planetary strength
    const categoryPlanets: Record<string, { primary: string[]; secondary: string[]; neutral: string[]; challenging: string[] }> = {
      relationship: {
        primary: ['Venus', 'Jupiter'],
        secondary: ['Moon', 'Mercury'],
        neutral: ['Sun', 'Mars'],
        challenging: ['Saturn', 'Rahu', 'Ketu'],
      },
      love: {
        primary: ['Venus', 'Jupiter'],
        secondary: ['Moon'],
        neutral: ['Mercury', 'Sun'],
        challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
      },
      career: {
        primary: ['Mercury', 'Jupiter', 'Sun'],
        secondary: ['Venus', 'Moon'],
        neutral: ['Mars'],
        challenging: ['Saturn', 'Rahu', 'Ketu'],
      },
      wealth: {
        primary: ['Jupiter', 'Venus'],
        secondary: ['Mercury', 'Moon'],
        neutral: ['Sun'],
        challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
      },
      money: {
        primary: ['Jupiter', 'Venus'],
        secondary: ['Mercury'],
        neutral: ['Sun', 'Moon'],
        challenging: ['Saturn', 'Mars', 'Rahu', 'Ketu'],
      },
      health: {
        primary: ['Mars', 'Sun', 'Moon'],
        secondary: ['Jupiter'],
        neutral: ['Mercury', 'Venus'],
        challenging: ['Saturn', 'Rahu', 'Ketu'],
      },
      spiritual: {
        primary: ['Jupiter', 'Ketu', 'Saturn'],
        secondary: ['Moon', 'Sun'],
        neutral: ['Mercury', 'Venus'],
        challenging: ['Mars', 'Rahu'],
      },
      other: {
        primary: ['Jupiter', 'Venus'],
        secondary: ['Mercury', 'Moon'],
        neutral: ['Sun', 'Mars'],
        challenging: ['Saturn', 'Rahu', 'Ketu'],
      },
    };

    const planetAlignment = categoryPlanets[category] || categoryPlanets.other;

    const calculateDashaResonance = (lord: string | null): { supportive: number; challenging: number } => {
      if (!lord || lord === 'Unknown') {
        return { supportive: 0, challenging: 100 };
      }

      if (planetAlignment.primary.includes(lord)) {
        // Highly favorable - 85-95% supportive
        return { supportive: 90, challenging: 10 };
      } else if (planetAlignment.secondary.includes(lord)) {
        // Favorable - 70-85% supportive
        return { supportive: 77, challenging: 23 };
      } else if (planetAlignment.neutral.includes(lord)) {
        // Neutral - 50-60% supportive
        return { supportive: 55, challenging: 45 };
      } else if (planetAlignment.challenging.includes(lord)) {
        // Challenging - 25-40% supportive
        return { supportive: 32, challenging: 68 };
      } else {
        // Unknown planet - neutral
        return { supportive: 50, challenging: 50 };
      }
    };

    const mahadashaResonance = calculateDashaResonance(currentMahadasha?.lord || currentMahadasha?.mahadasha_lord || null);
    const antardashaResonance = calculateDashaResonance(currentAntardasha?.lord || currentAntardasha?.antardasha_lord || null);
    const pratyantarResonance = calculateDashaResonance(currentPratyantar?.lord || currentPratyantar?.pratyantar_lord || null);
    const sukshmaResonance = calculateDashaResonance(currentSukshma?.lord || currentSukshma?.sukshma_lord || null);

    // Build supportive factors based on real Dasha analysis
    const supportiveFactors: Array<{
      type: string;
      description: string;
      score: number;
      weightage: number;
      period?: string;
    }> = [];

    // Add Mahadasha if favorable
    if (currentMahadasha && mahadashaResonance.supportive >= 70) {
      const mahaLord = currentMahadasha.lord || currentMahadasha.mahadasha_lord;
      const score = Math.round(mahadashaResonance.supportive);
      const startDate = currentMahadasha.start instanceof Date ? currentMahadasha.start : new Date(currentMahadasha.start || currentMahadasha.start_date);
      const endDate = currentMahadasha.end instanceof Date ? currentMahadasha.end : new Date(currentMahadasha.end || currentMahadasha.end_date);
      supportiveFactors.push({
        type: 'mahadasha',
        description: `Best Mahadasha period: ${mahaLord} (${score}% supportive)`,
        score: score,
        weightage: 0.5,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      });
    }

    // Add Antardasha if favorable
    if (currentAntardasha && antardashaResonance.supportive >= 70) {
      const antaraLord = currentAntardasha.lord || currentAntardasha.antardasha_lord;
      const score = Math.round(antardashaResonance.supportive);
      const startDate = currentAntardasha.start instanceof Date ? currentAntardasha.start : new Date(currentAntardasha.start || currentAntardasha.start_date);
      const endDate = currentAntardasha.end instanceof Date ? currentAntardasha.end : new Date(currentAntardasha.end || currentAntardasha.end_date);
      supportiveFactors.push({
        type: 'antardasha',
        description: `Best Antardasha period: ${antaraLord} (${score}% supportive)`,
        score: score,
        weightage: 0.9,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      });
    }

    // Add Pratyantar if favorable
    if (currentPratyantar && pratyantarResonance.supportive >= 70) {
      const pratyantarLord = currentPratyantar.lord || currentPratyantar.pratyantar_lord;
      const score = Math.round(pratyantarResonance.supportive);
      const startDate = currentPratyantar.start instanceof Date ? currentPratyantar.start : new Date(currentPratyantar.start || currentPratyantar.start_date);
      const endDate = currentPratyantar.end instanceof Date ? currentPratyantar.end : new Date(currentPratyantar.end || currentPratyantar.end_date);
      supportiveFactors.push({
        type: 'pratyantar',
        description: `Favorable Pratyantar period: ${pratyantarLord} (${score}% supportive)`,
        score: score,
        weightage: 0.3,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      });
    }

    // Add Dasha analysis summary if we have Dasha data
    if (currentMahadasha && currentAntardasha) {
      const avgSupport = Math.round((mahadashaResonance.supportive + antardashaResonance.supportive) / 2);
      supportiveFactors.push({
        type: 'dasha_analysis',
        description: `Analyzed Dasha periods from now until fulfillment date. Average support: ${avgSupport}%`,
        score: avgSupport,
        weightage: 1.0,
      });
    }

    // Build challenging factors based on real analysis
    const challengingFactors: Array<{
      type: string;
      description: string;
      impact: number;
      weightage: number;
    }> = [];

    // Add challenging Dasha periods
    if (currentMahadasha && mahadashaResonance.challenging >= 60) {
      const mahaLord = currentMahadasha.lord || currentMahadasha.mahadasha_lord;
      challengingFactors.push({
        type: 'mahadasha',
        description: `${mahaLord} Mahadasha period is challenging for this manifestation (${Math.round(mahadashaResonance.challenging)}% challenging)`,
        impact: Math.round(mahadashaResonance.challenging),
        weightage: 15,
      });
    }

    if (currentAntardasha && antardashaResonance.challenging >= 60) {
      const antaraLord = currentAntardasha.lord || currentAntardasha.antardasha_lord;
      challengingFactors.push({
        type: 'antardasha',
        description: `${antaraLord} Antardasha period creates obstacles (${Math.round(antardashaResonance.challenging)}% challenging)`,
        impact: Math.round(antardashaResonance.challenging),
        weightage: 10,
      });
    }

    // Add karma debt as challenging factor
    if (evaluation.scores.mahaadha_score > 30) {
      challengingFactors.push({
        type: 'karma_debt',
        description: `Recent karma debt reduces momentum (Mahaadha score: ${Math.round(evaluation.scores.mahaadha_score)})`,
        impact: Math.min(50, Math.round(evaluation.scores.mahaadha_score)),
        weightage: 10,
      });
    }

    // Add low resonance as challenging factor
    if (resonanceScore < 50) {
      challengingFactors.push({
        type: 'low_resonance',
        description: `Manifestation needs more clarity and positive energy (Resonance: ${Math.round(resonanceScore)}%)`,
        impact: Math.round(100 - resonanceScore),
        weightage: 20,
      });
    }

    // Determine manifestation class based on resonance and Dasha alignment
    const avgDashaSupport = currentMahadasha && currentAntardasha
      ? (mahadashaResonance.supportive + antardashaResonance.supportive) / 2
      : mahadashaResonance.supportive;

    let manifestationClass = 'neutral';
    let manifestationClassLabel = 'Neutral';

    if (resonanceScore >= 80 && avgDashaSupport >= 75) {
      manifestationClass = 'highly_favourable';
      manifestationClassLabel = 'Highly Favourable - Strong Dasha Alignment';
    } else if (resonanceScore >= 70 && avgDashaSupport >= 65) {
      manifestationClass = 'highly_favourable';
      manifestationClassLabel = 'Highly Favourable - Good Dasha Alignment';
    } else if (resonanceScore >= 60 || avgDashaSupport >= 60) {
      manifestationClass = 'favourable';
      manifestationClassLabel = 'Favourable';
    } else if (resonanceScore < 40 || avgDashaSupport < 40) {
      manifestationClass = 'challenging';
      manifestationClassLabel = 'Challenging - Needs More Alignment';
    } else {
      manifestationClass = 'neutral';
      manifestationClassLabel = 'Neutral - Moderate Support';
    }

    return {
      resonance_score: Math.round(resonanceScore * 10) / 10,
      category,
      category_label: categoryLabel,
      manifestation_class: manifestationClass,
      manifestation_class_label: manifestationClassLabel,
      supportive_factors: supportiveFactors,
      challenging_factors: challengingFactors,
      dasha_resonance: {
        mahadasha: {
          lord: currentMahadasha?.lord || currentMahadasha?.mahadasha_lord || 'Unknown',
          supportive: mahadashaResonance.supportive,
          challenging: mahadashaResonance.challenging,
          period: currentMahadasha
            ? `${(currentMahadasha.start instanceof Date ? currentMahadasha.start : new Date(currentMahadasha.start || currentMahadasha.start_date)).toISOString().split('T')[0]} to ${(currentMahadasha.end instanceof Date ? currentMahadasha.end : new Date(currentMahadasha.end || currentMahadasha.end_date)).toISOString().split('T')[0]}`
            : 'N/A',
        },
        antardasha: {
          lord: currentAntardasha?.lord || currentAntardasha?.antardasha_lord || 'Unknown',
          supportive: antardashaResonance.supportive,
          challenging: antardashaResonance.challenging,
          period: currentAntardasha
            ? `${(currentAntardasha.start instanceof Date ? currentAntardasha.start : new Date(currentAntardasha.start || currentAntardasha.start_date)).toISOString().split('T')[0]} to ${(currentAntardasha.end instanceof Date ? currentAntardasha.end : new Date(currentAntardasha.end || currentAntardasha.end_date)).toISOString().split('T')[0]}`
            : 'N/A',
        },
        pratyantar: {
          lord: currentPratyantar?.lord || currentPratyantar?.pratyantar_lord || 'Unknown',
          supportive: pratyantarResonance.supportive,
          challenging: pratyantarResonance.challenging,
          period: currentPratyantar
            ? `${(currentPratyantar.start instanceof Date ? currentPratyantar.start : new Date(currentPratyantar.start || currentPratyantar.start_date)).toISOString().split('T')[0]} to ${(currentPratyantar.end instanceof Date ? currentPratyantar.end : new Date(currentPratyantar.end || currentPratyantar.end_date)).toISOString().split('T')[0]}`
            : 'N/A',
        },
        sukshma: {
          lord: currentSukshma?.lord || currentSukshma?.sukshma_lord || 'Unknown',
          supportive: sukshmaResonance.supportive,
          challenging: sukshmaResonance.challenging,
          period: currentSukshma
            ? `${(currentSukshma.start instanceof Date ? currentSukshma.start : new Date(currentSukshma.start || currentSukshma.start_date)).toISOString().split('T')[0]} to ${(currentSukshma.end instanceof Date ? currentSukshma.end : new Date(currentSukshma.end || currentSukshma.end_date)).toISOString().split('T')[0]}`
            : 'N/A',
        },
      },
      tips: await this.generateEnhancedTips(
        evaluation.tips,
        category,
        currentMahadasha,
        currentAntardasha,
        planets,
        houses,
        kundli,
      ),
      insights: await this.generateEnhancedInsights(
        evaluation.insights,
        category,
        currentMahadasha,
        currentAntardasha,
        planets,
        houses,
        kundli,
      ),
    };
  }

  /**
   * Calculate current dasha periods from kundli's dasha_timeline
   */
  private calculateCurrentDashaFromTimeline(
    dashaTimeline: any[],
    currentDate: Date,
    birthDate: Date,
  ): {
    mahadasha: { lord: string; start: Date; end: Date } | null;
    antardasha: { lord: string; start: Date; end: Date } | null;
    pratyantar: { lord: string; start: Date; end: Date } | null;
    sukshma: { lord: string; start: Date; end: Date } | null;
  } {
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

    // If dasha_timeline is an array of mahadasha periods
    if (Array.isArray(dashaTimeline) && dashaTimeline.length > 0) {
      // Find current mahadasha
      const currentMaha = dashaTimeline.find((d: any) => {
        // Handle both Date objects and ISO strings
        const start = d.start instanceof Date ? d.start : new Date(d.start || d.start_date);
        const end = d.end instanceof Date ? d.end : new Date(d.end || d.end_date);
        return currentDate >= start && currentDate < end;
      });

      if (currentMaha) {
        const mahaLord = currentMaha.lord || currentMaha.mahadasha_lord;
        const mahaStart = new Date(currentMaha.start || currentMaha.start_date);
        const mahaEnd = new Date(currentMaha.end || currentMaha.end_date);

        // Calculate antardasha (sub-period within mahadasha)
        const mahaIndex = dashaSequence.indexOf(mahaLord);
        const mahaDuration = dashaDurations[mahaLord];
        const elapsed = (currentDate.getTime() - mahaStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const progress = elapsed / mahaDuration;

        // Each antardasha is 1/9th of mahadasha
        const antaraIndex = Math.floor(progress * 9);
        const antaraLord = dashaSequence[(mahaIndex + antaraIndex) % 9];
        const antaraDuration = mahaDuration / 9;
        const antaraStart = new Date(mahaStart);
        antaraStart.setTime(antaraStart.getTime() + antaraIndex * antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
        const antaraEnd = new Date(antaraStart);
        antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);

        // Calculate pratyantar (sub-period within antardasha)
        const pratyantarIndex = Math.floor((progress * 9 - antaraIndex) * 9);
        const pratyantarLord = dashaSequence[(dashaSequence.indexOf(antaraLord) + pratyantarIndex) % 9];
        const pratyantarDuration = antaraDuration / 9;
        const pratyantarStart = new Date(antaraStart);
        pratyantarStart.setTime(pratyantarStart.getTime() + pratyantarIndex * pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
        const pratyantarEnd = new Date(pratyantarStart);
        pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);

        // Calculate sukshma (sub-period within pratyantar)
        const sukshmaIndex = Math.floor(((progress * 9 - antaraIndex) * 9 - pratyantarIndex) * 9);
        const sukshmaLord = dashaSequence[(dashaSequence.indexOf(pratyantarLord) + sukshmaIndex) % 9];
        const sukshmaDuration = pratyantarDuration / 9;
        const sukshmaStart = new Date(pratyantarStart);
        sukshmaStart.setTime(sukshmaStart.getTime() + sukshmaIndex * sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
        const sukshmaEnd = new Date(sukshmaStart);
        sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);

        return {
          mahadasha: { lord: mahaLord, start: mahaStart, end: mahaEnd },
          antardasha: { lord: antaraLord, start: antaraStart, end: antaraEnd },
          pratyantar: { lord: pratyantarLord, start: pratyantarStart, end: pratyantarEnd },
          sukshma: { lord: sukshmaLord, start: sukshmaStart, end: sukshmaEnd },
        };
      }
    }

    // If no timeline found, return null (will be handled by caller)
    return {
      mahadasha: null,
      antardasha: null,
      pratyantar: null,
      sukshma: null,
    };
  }

  /**
   * Calculate dasha from birth date and nakshatra
   */
  private calculateDashaFromBirthDateAndNakshatra(
    birthDate: Date,
    nakshatraName: string,
    currentDate: Date,
  ): {
    mahadasha: { lord: string; start: Date; end: Date } | null;
    antardasha: { lord: string; start: Date; end: Date } | null;
    pratyantar: { lord: string; start: Date; end: Date } | null;
    sukshma: { lord: string; start: Date; end: Date } | null;
  } {
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

    // Map nakshatra to its lord
    const nakshatraLords: Record<string, string> = {
      'Ashwini': 'Ketu',
      'Bharani': 'Venus',
      'Krittika': 'Sun',
      'Rohini': 'Moon',
      'Mrigashira': 'Mars',
      'Ardra': 'Rahu',
      'Punarvasu': 'Jupiter',
      'Pushya': 'Saturn',
      'Ashlesha': 'Mercury',
      'Magha': 'Ketu',
      'Purva Phalguni': 'Venus',
      'Uttara Phalguni': 'Sun',
      'Hasta': 'Moon',
      'Chitra': 'Mars',
      'Swati': 'Rahu',
      'Vishakha': 'Jupiter',
      'Anuradha': 'Saturn',
      'Jyeshtha': 'Mercury',
      'Mula': 'Ketu',
      'Purva Ashadha': 'Venus',
      'Uttara Ashadha': 'Sun',
      'Shravana': 'Moon',
      'Dhanishta': 'Mars',
      'Shatabhisha': 'Rahu',
      'Purva Bhadrapada': 'Jupiter',
      'Uttara Bhadrapada': 'Saturn',
      'Revati': 'Mercury',
    };

    // Get nakshatra lord
    const nakshatraLord = nakshatraLords[nakshatraName] || 'Moon';
    const startIndex = dashaSequence.indexOf(nakshatraLord);
    const actualStartIndex = startIndex !== -1 ? startIndex : dashaSequence.indexOf('Moon');

    // Calculate Mahadasha periods
    const mahadashas: Array<{ lord: string; start: Date; end: Date }> = [];
    let loopDate = new Date(birthDate);

    // Calculate next 120 years of dashas (full cycle)
    for (let i = 0; i < 9; i++) {
      const lordIndex = (actualStartIndex + i) % 9;
      const lord = dashaSequence[lordIndex];
      const duration = dashaDurations[lord];
      const start = new Date(loopDate);
      const end = new Date(loopDate);
      end.setTime(end.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);

      mahadashas.push({ lord, start, end });
      loopDate = new Date(end);
    }

    // Find current mahadasha
    const currentMaha = mahadashas.find((m) => currentDate >= m.start && currentDate < m.end) || mahadashas[0];

    if (!currentMaha) {
      return {
        mahadasha: null,
        antardasha: null,
        pratyantar: null,
        sukshma: null,
      };
    }

    const mahaLord = currentMaha.lord;
    const mahaStart = currentMaha.start;
    const mahaEnd = currentMaha.end;
    const mahaDuration = dashaDurations[mahaLord];
    const elapsed = (currentDate.getTime() - mahaStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const progress = Math.max(0, Math.min(1, elapsed / mahaDuration));

    // Calculate antardasha (sub-period within mahadasha)
    const mahaIndex = dashaSequence.indexOf(mahaLord);
    const antaraIndex = Math.floor(progress * 9);
    const antaraLord = dashaSequence[(mahaIndex + antaraIndex) % 9];
    const antaraDuration = mahaDuration / 9;
    const antaraStart = new Date(mahaStart);
    antaraStart.setTime(antaraStart.getTime() + antaraIndex * antaraDuration * 365.25 * 24 * 60 * 60 * 1000);
    const antaraEnd = new Date(antaraStart);
    antaraEnd.setTime(antaraEnd.getTime() + antaraDuration * 365.25 * 24 * 60 * 60 * 1000);

    // Calculate pratyantar (sub-period within antardasha)
    const pratyantarProgress = (progress * 9 - antaraIndex);
    const pratyantarIndex = Math.floor(pratyantarProgress * 9);
    const pratyantarLord = dashaSequence[(dashaSequence.indexOf(antaraLord) + pratyantarIndex) % 9];
    const pratyantarDuration = antaraDuration / 9;
    const pratyantarStart = new Date(antaraStart);
    pratyantarStart.setTime(pratyantarStart.getTime() + pratyantarIndex * pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);
    const pratyantarEnd = new Date(pratyantarStart);
    pratyantarEnd.setTime(pratyantarEnd.getTime() + pratyantarDuration * 365.25 * 24 * 60 * 60 * 1000);

    // Calculate sukshma (sub-period within pratyantar)
    const sukshmaProgress = (pratyantarProgress * 9 - pratyantarIndex);
    const sukshmaIndex = Math.floor(sukshmaProgress * 9);
    const sukshmaLord = dashaSequence[(dashaSequence.indexOf(pratyantarLord) + sukshmaIndex) % 9];
    const sukshmaDuration = pratyantarDuration / 9;
    const sukshmaStart = new Date(pratyantarStart);
    sukshmaStart.setTime(sukshmaStart.getTime() + sukshmaIndex * sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);
    const sukshmaEnd = new Date(sukshmaStart);
    sukshmaEnd.setTime(sukshmaEnd.getTime() + sukshmaDuration * 365.25 * 24 * 60 * 60 * 1000);

    return {
      mahadasha: { lord: mahaLord, start: mahaStart, end: mahaEnd },
      antardasha: { lord: antaraLord, start: antaraStart, end: antaraEnd },
      pratyantar: { lord: pratyantarLord, start: pratyantarStart, end: pratyantarEnd },
      sukshma: { lord: sukshmaLord, start: sukshmaStart, end: sukshmaEnd },
    };
  }

  /**
   * Generate enhanced tips based on kundli data
   */
  private async generateEnhancedTips(
    baseTips: any,
    category: string,
    mahadasha: any,
    antardasha: any,
    planets: KundliPlanet[],
    houses: KundliHouse[],
    kundli: Kundli | null,
  ): Promise<any> {
    const tips = { ...baseTips };

    // Enhance rituals based on dasha
    if (mahadasha && antardasha) {
      const dashaRituals = this.getDashaSpecificRituals(mahadasha.lord, antardasha.lord, category);
      if (dashaRituals.length > 0) {
        tips.rituals = [...(tips.rituals || []), ...dashaRituals];
      }
    }

    // Enhance what to manifest based on planetary positions
    if (planets.length > 0) {
      const planetaryGuidance = this.getPlanetaryGuidance(planets, category);
      if (planetaryGuidance.whatToManifest.length > 0) {
        tips.what_to_manifest = [...(tips.what_to_manifest || []), ...planetaryGuidance.whatToManifest];
      }
      if (planetaryGuidance.whatNotToManifest.length > 0) {
        tips.what_not_to_manifest = [...(tips.what_not_to_manifest || []), ...planetaryGuidance.whatNotToManifest];
      }
    }

    // Add karmic theme based on houses
    if (houses.length > 0) {
      const karmicTheme = this.getKarmicTheme(houses, category);
      if (karmicTheme) {
        tips.karmic_theme = karmicTheme;
      }
    }

    // Enhance thought alignment based on dasha
    if (mahadasha) {
      const alignmentTips = this.getDashaAlignmentTips(mahadasha.lord, category);
      if (alignmentTips.length > 0) {
        tips.thought_alignment = [...(tips.thought_alignment || []), ...alignmentTips];
      }
    }

    // Add daily actions based on current planetary influences
    if (planets.length > 0 && mahadasha) {
      tips.daily_actions = this.getDailyActions(planets, mahadasha.lord, category);
    }

    return tips;
  }

  /**
   * Generate enhanced insights based on kundli data
   */
  private async generateEnhancedInsights(
    baseInsights: any,
    category: string,
    mahadasha: any,
    antardasha: any,
    planets: KundliPlanet[],
    houses: KundliHouse[],
    kundli: Kundli | null,
  ): Promise<any> {
    const insights = { ...baseInsights };

    // Add astro insights based on kundli data
    if (kundli && planets.length > 0) {
      insights.astro_insights = this.generateAstroInsights(kundli, planets, houses, mahadasha, antardasha, category);
    }

    return insights;
  }

  /**
   * Get dasha-specific rituals
   */
  private getDashaSpecificRituals(mahadashaLord: string, antardashaLord: string, category: string): string[] {
    const rituals: string[] = [];

    // Mahadasha rituals
    const mahaRituals: Record<string, Record<string, string[]>> = {
      Jupiter: {
        career: [
          'Chant "Om Gurave Namah" 108 times daily for career growth.',
          'Wear yellow clothes on Thursdays and offer yellow flowers to Lord Vishnu.',
        ],
        wealth: [
          'Donate yellow items (turmeric, yellow clothes) on Thursdays.',
          'Recite Guru Mantra: "Om Brihaspataye Namah" 108 times.',
        ],
      },
      Venus: {
        love: [
          'Chant "Om Shukraya Namah" 108 times daily for relationship harmony.',
          'Wear white clothes on Fridays and offer white flowers.',
        ],
        career: [
          'Wear white or light-colored clothes on Fridays for professional success.',
        ],
      },
      Sun: {
        career: [
          'Chant "Om Suryaya Namah" 108 times at sunrise.',
          'Offer water to Sun God every morning facing east.',
        ],
      },
      Moon: {
        love: [
          'Chant "Om Chandraya Namah" 108 times on Mondays.',
          'Observe Monday fasts and offer white items to Lord Shiva.',
        ],
      },
      Mercury: {
        career: [
          'Chant "Om Budhaya Namah" 108 times on Wednesdays.',
          'Wear green clothes and offer green items on Wednesdays.',
        ],
      },
    };

    if (mahaRituals[mahadashaLord] && mahaRituals[mahadashaLord][category]) {
      rituals.push(...mahaRituals[mahadashaLord][category]);
    }

    return rituals;
  }

  /**
   * Get planetary guidance based on planet positions
   */
  private getPlanetaryGuidance(planets: KundliPlanet[], category: string): {
    whatToManifest: string[];
    whatNotToManifest: string[];
  } {
    const whatToManifest: string[] = [];
    const whatNotToManifest: string[] = [];

    // Analyze planet positions relevant to category
    const categoryPlanets: Record<string, string[]> = {
      career: ['Sun', 'Mercury', 'Jupiter'],
      love: ['Venus', 'Moon', 'Jupiter'],
      wealth: ['Jupiter', 'Venus'],
      health: ['Sun', 'Moon', 'Mars'],
    };

    const relevantPlanets = categoryPlanets[category] || [];
    
    planets.forEach((planet) => {
      if (relevantPlanets.includes(planet.planet_name)) {
        if (planet.house_number <= 6) {
          whatToManifest.push(`Focus on ${planet.planet_name}'s energy in ${planet.house_number}th house for ${category} growth.`);
        }
        if (planet.is_retrograde) {
          whatNotToManifest.push(`Avoid hasty decisions during ${planet.planet_name} retrograde period.`);
        }
      }
    });

    return { whatToManifest, whatNotToManifest };
  }

  /**
   * Get karmic theme based on house positions
   */
  private getKarmicTheme(houses: KundliHouse[], category: string): string | null {
    // Analyze relevant houses for category
    const categoryHouses: Record<string, number[]> = {
      career: [10, 6, 1],
      love: [7, 5, 4],
      wealth: [2, 11, 9],
      health: [6, 1, 8],
    };

    const relevantHouses = categoryHouses[category] || [];
    const houseData = houses.filter((h) => relevantHouses.includes(h.house_number));

    if (houseData.length > 0) {
      const signs = houseData.map((h) => h.sign_name).join(', ');
      return `Your karmic theme for ${category} is influenced by ${signs} energy in key houses. Focus on balancing these energies.`;
    }

    return null;
  }

  /**
   * Get dasha alignment tips
   */
  private getDashaAlignmentTips(mahadashaLord: string, category: string): string[] {
    const tips: string[] = [];

    const alignmentGuidance: Record<string, Record<string, string[]>> = {
      Jupiter: {
        career: [
          'Align your thoughts with expansion and growth. Jupiter supports learning and teaching.',
          'Focus on long-term goals and ethical practices.',
        ],
        wealth: [
          'Think abundantly. Jupiter brings prosperity through wisdom and generosity.',
        ],
      },
      Venus: {
        love: [
          'Align with harmony and beauty. Venus supports relationships and artistic pursuits.',
        ],
        career: [
          'Focus on creative and diplomatic approaches. Venus supports partnerships.',
        ],
      },
      Sun: {
        career: [
          'Align with leadership and authority. Sun supports confidence and recognition.',
        ],
      },
    };

    if (alignmentGuidance[mahadashaLord] && alignmentGuidance[mahadashaLord][category]) {
      tips.push(...alignmentGuidance[mahadashaLord][category]);
    }

    return tips;
  }

  /**
   * Get daily actions based on planetary influences
   */
  private getDailyActions(planets: KundliPlanet[], mahadashaLord: string, category: string): string[] {
    const actions: string[] = [];

    // Get relevant planet for category
    const categoryPlanetMap: Record<string, string> = {
      career: 'Sun',
      love: 'Venus',
      wealth: 'Jupiter',
      health: 'Mars',
    };

    const relevantPlanetName = categoryPlanetMap[category] || 'Jupiter';
    const relevantPlanet = planets.find((p) => p.planet_name === relevantPlanetName);

    if (relevantPlanet) {
      actions.push(`Meditate on ${relevantPlanet.planet_name}'s energy in ${relevantPlanet.house_number}th house daily.`);
      if (relevantPlanet.is_retrograde) {
        actions.push(`During ${relevantPlanet.planet_name} retrograde, focus on review and reflection rather than new initiatives.`);
      }
    }

    if (mahadashaLord) {
      actions.push(`Align your daily actions with ${mahadashaLord} Mahadasha energy for better results.`);
    }

    return actions;
  }

  /**
   * Generate astro insights based on kundli data
   */
  private generateAstroInsights(
    kundli: Kundli,
    planets: KundliPlanet[],
    houses: KundliHouse[],
    mahadasha: any,
    antardasha: any,
    category: string,
  ): string {
    const insights: string[] = [];

    if (mahadasha && antardasha) {
      insights.push(`Current Dasha: ${mahadasha.lord} Mahadasha with ${antardasha.lord} Antardasha.`);
    }

    if (kundli.nakshatra) {
      insights.push(`Your birth Nakshatra is ${kundli.nakshatra}, which influences your approach to ${category}.`);
    }

    if (kundli.lagna_name) {
      insights.push(`Your Ascendant (Lagna) is ${kundli.lagna_name}, indicating your natural approach to ${category} matters.`);
    }

    // Add planet-specific insights
    const categoryPlanets: Record<string, string[]> = {
      career: ['Sun', 'Mercury', 'Jupiter'],
      love: ['Venus', 'Moon'],
      wealth: ['Jupiter', 'Venus'],
    };

    const relevantPlanets = categoryPlanets[category] || [];
    const userPlanets = planets.filter((p) => relevantPlanets.includes(p.planet_name));

    if (userPlanets.length > 0) {
      const planetInfo = userPlanets.map((p) => `${p.planet_name} in ${p.house_number}th house`).join(', ');
      insights.push(`Key planetary influences: ${planetInfo}.`);
    }

    return insights.join(' ') || 'Astrological analysis based on your birth chart supports this manifestation.';
  }
}


