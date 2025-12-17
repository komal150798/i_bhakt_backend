import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manifestation } from '../entities/manifestation.entity';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import { ManifestationAIEvaluationService } from './manifestation-ai-evaluation.service';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../users/entities/customer.entity';

@Injectable()
export class ManifestationEnhancedService {
  constructor(
    @InjectRepository(Manifestation)
    private manifestationRepository: Repository<Manifestation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private aiEvaluationService: ManifestationAIEvaluationService,
  ) {}

  /**
   * Create a new manifestation with AI evaluation
   */
  async createManifestation(
    userId: number,
    dto: CreateManifestationEnhancedDto,
  ): Promise<Manifestation> {
    // Validate description length (15-20 characters min)
    if (dto.description.trim().length < 15) {
      throw new BadRequestException(
        'Description must be at least 15 characters long. Please provide more details about your manifestation intent.',
      );
    }

    // Validate title
    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Title is required');
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

    // Run AI + Swiss Ephemeris evaluation (category will be auto-detected if not provided)
    // Pass user as User type (both Customer and User have compatible fields for this)
    const evaluation = await this.aiEvaluationService.evaluateManifestation(
      dto.title,
      dto.description,
      dto.category,
      user as User,
    );

    // Use detected category if not provided in DTO
    const finalCategory = dto.category || evaluation.detectedCategory || null;

    // Create manifestation entity
    const manifestation = this.manifestationRepository.create({
      user_id: userId,
      title: dto.title.trim(),
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
      tips: evaluation.tips,
      insights: evaluation.insights,
      is_archived: false,
    });

    return await this.manifestationRepository.save(manifestation);
  }

  /**
   * Get dashboard data for user
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
      resonance_score: number | null;
      mfp_score: number | null;
      is_archived: boolean;
      added_date: Date;
      category: string | null;
    }>;
  }> {
    // Get active manifestations
    const activeManifestations = await this.manifestationRepository.find({
      where: {
        user_id: userId,
        is_archived: false,
        is_deleted: false,
      },
      order: { added_date: 'DESC' },
    });

    // Calculate summary from top manifestation
    let top_resonance = 0;
    let alignment_score = 0;
    let astro_support = 0;
    let energy_state: 'aligned' | 'unstable' | 'blocked' = 'aligned';

    if (activeManifestations.length > 0) {
      const topManifestation = activeManifestations[0];
      top_resonance = topManifestation.resonance_score || 0;
      alignment_score = topManifestation.alignment_score || 0;
      astro_support = topManifestation.astro_support_index || 0;
      energy_state = topManifestation.insights?.energy_state || 'aligned';
    }

    return {
      summary: {
        top_resonance,
        alignment_score,
        astro_support,
        energy_state,
      },
      manifestations: activeManifestations.map((m) => ({
        id: m.id,
        title: m.title,
        resonance_score: m.resonance_score,
        mfp_score: m.mfp_score,
        is_archived: m.is_archived,
        added_date: m.added_date,
        category: m.category,
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
}


