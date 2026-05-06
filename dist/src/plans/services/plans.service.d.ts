import { Cache } from 'cache-manager';
import { IPlanRepository } from '../../core/interfaces/repositories/plan-repository.interface';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';
import { PlanResponseDto } from '../dtos/plan-response.dto';
import { Plan } from '../entities/plan.entity';
export declare class PlansService {
    private readonly planRepository;
    private readonly cacheManager;
    private readonly CACHE_TTL;
    private readonly CACHE_KEY_PREFIX;
    constructor(planRepository: IPlanRepository, cacheManager: Cache);
    create(createPlanDto: CreatePlanDto, userId: number): Promise<PlanResponseDto>;
    findAll(options?: {
        is_enabled?: boolean;
    }): Promise<PlanResponseDto[]>;
    resolveSubscribablePlan(params: {
        unique_id?: string;
        plan_id?: number;
    }): Promise<Plan>;
    findOneByUniqueId(uniqueId: string): Promise<PlanResponseDto>;
    update(uniqueId: string, updatePlanDto: UpdatePlanDto, userId: number): Promise<PlanResponseDto>;
    assignModules(uniqueId: string, moduleSlugs: string[], userId: number): Promise<PlanResponseDto>;
    remove(uniqueId: string, userId: number): Promise<void>;
    private invalidateCache;
    private toResponseDto;
}
