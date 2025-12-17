import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IPlanRepository } from '../../core/interfaces/repositories/plan-repository.interface';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';
import { PlanResponseDto } from '../dtos/plan-response.dto';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_KEY_PREFIX = 'plans:';

  constructor(
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createPlanDto: CreatePlanDto, userId: number): Promise<PlanResponseDto> {
    // Check if plan_type already exists
    const existing = await this.planRepository.findByPlanType(createPlanDto.plan_type);

    if (existing) {
      throw new ConflictException(`Plan with type "${createPlanDto.plan_type}" already exists`);
    }

    const plan = await this.planRepository.create({
      ...createPlanDto,
      added_by: userId,
      modify_by: userId,
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.toResponseDto(plan);
  }

  async findAll(options?: { is_enabled?: boolean }): Promise<PlanResponseDto[]> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}all:${options?.is_enabled ?? 'all'}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<PlanResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from repository
    const plans = await this.planRepository.findAll({
      is_enabled: options?.is_enabled,
      is_deleted: false,
    });

    const response = plans.map((p) => this.toResponseDto(p));

    // Cache the result
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async findOneByUniqueId(uniqueId: string): Promise<PlanResponseDto> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}unique:${uniqueId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<PlanResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const plan = await this.planRepository.findByUniqueId(uniqueId);

    if (!plan) {
      throw new NotFoundException(`Plan with unique ID ${uniqueId} not found`);
    }

    const response = this.toResponseDto(plan);

    // Cache the result
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async update(uniqueId: string, updatePlanDto: UpdatePlanDto, userId: number): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findByUniqueId(uniqueId);

    if (!plan) {
      throw new NotFoundException(`Plan with unique ID ${uniqueId} not found`);
    }

    // Check plan_type uniqueness if being updated
    if (updatePlanDto.plan_type && updatePlanDto.plan_type !== plan.plan_type) {
      const existing = await this.planRepository.findByPlanType(updatePlanDto.plan_type);

      if (existing) {
        throw new ConflictException(`Plan with type "${updatePlanDto.plan_type}" already exists`);
      }
    }

    const updated = await this.planRepository.update(plan, {
      ...updatePlanDto,
      modify_by: userId,
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.toResponseDto(updated);
  }

  async assignModules(uniqueId: string, moduleSlugs: string[], userId: number): Promise<PlanResponseDto> {
    const plan = await this.planRepository.findByUniqueId(uniqueId);

    if (!plan) {
      throw new NotFoundException(`Plan with unique ID ${uniqueId} not found`);
    }

    const updated = await this.planRepository.assignModules(plan, moduleSlugs);
    plan.modify_by = userId;
    await this.planRepository.update(plan, { modify_by: userId });

    // Invalidate cache
    await this.invalidateCache();

    return this.toResponseDto(updated);
  }

  async remove(uniqueId: string, userId: number): Promise<void> {
    const plan = await this.planRepository.findByUniqueId(uniqueId);

    if (!plan) {
      throw new NotFoundException(`Plan with unique ID ${uniqueId} not found`);
    }

    await this.planRepository.delete(plan, userId);

    // Invalidate cache
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    // Invalidate all plan-related cache keys
    // In a production system, you might want to track keys more precisely
    const keys = await this.cacheManager.store?.keys?.(`${this.CACHE_KEY_PREFIX}*`);
    if (keys && Array.isArray(keys)) {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }

  private toResponseDto(plan: Plan): PlanResponseDto {
    return {
      unique_id: plan.unique_id,
      plan_type: plan.plan_type,
      name: plan.name,
      description: plan.description,
      tagline: plan.tagline,
      monthly_price: Number(plan.monthly_price),
      yearly_price: plan.yearly_price ? Number(plan.yearly_price) : null,
      currency: plan.currency,
      billing_cycle_days: plan.billing_cycle_days,
      trial_days: plan.trial_days,
      referral_count_required: plan.referral_count_required,
      is_popular: plan.is_popular,
      is_featured: plan.is_featured,
      sort_order: plan.sort_order,
      badge_color: plan.badge_color,
      badge_icon: plan.badge_icon,
      features: plan.features,
      usage_limits: plan.usage_limits,
      metadata: plan.metadata,
      modules: plan.modules?.map((m) => m.slug) || [],
      added_date: plan.added_date,
      modify_date: plan.modify_date,
    };
  }
}
