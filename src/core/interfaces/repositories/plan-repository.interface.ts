import { Plan } from '../../../plans/entities/plan.entity';
import { CreatePlanDto } from '../../../plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../../plans/dtos/update-plan.dto';

export interface IPlanRepository {
  findById(id: number): Promise<Plan | null>;
  findByUniqueId(uniqueId: string): Promise<Plan | null>;
  findByPlanType(planType: string): Promise<Plan | null>;
  findAll(options?: { is_enabled?: boolean; is_deleted?: boolean }): Promise<Plan[]>;
  create(data: CreatePlanDto & { added_by: number; modify_by: number }): Promise<Plan>;
  update(plan: Plan, data: UpdatePlanDto & { modify_by: number }): Promise<Plan>;
  delete(plan: Plan, userId: number): Promise<void>;
  assignModules(plan: Plan, moduleSlugs: string[]): Promise<Plan>;
}

