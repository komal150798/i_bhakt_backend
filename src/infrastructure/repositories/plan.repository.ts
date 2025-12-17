import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { Module } from '../../modules/entities/module.entity';
import { IPlanRepository } from '../../core/interfaces/repositories/plan-repository.interface';
import { CreatePlanDto } from '../../plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../plans/dtos/update-plan.dto';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
  ) {}

  async findById(id: number): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['modules'],
    });
  }

  async findByUniqueId(uniqueId: string): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { unique_id: uniqueId, is_deleted: false },
      relations: ['modules'],
    });
  }

  async findByPlanType(planType: string): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: { plan_type: planType as any, is_deleted: false },
      relations: ['modules'],
    });
  }

  async findAll(options?: { is_enabled?: boolean; is_deleted?: boolean }): Promise<Plan[]> {
    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.modules', 'module')
      .where('plan.is_deleted = :deleted', { deleted: options?.is_deleted ?? false });

    if (options?.is_enabled !== undefined) {
      queryBuilder.andWhere('plan.is_enabled = :enabled', { enabled: options.is_enabled });
    }

    return queryBuilder
      .orderBy('plan.sort_order', 'ASC')
      .addOrderBy('plan.added_date', 'DESC')
      .getMany();
  }

  async create(data: CreatePlanDto & { added_by: number; modify_by: number }): Promise<Plan> {
    const plan = this.planRepository.create({
      ...data,
      added_by: data.added_by,
      modify_by: data.modify_by,
    });
    return this.planRepository.save(plan);
  }

  async update(plan: Plan, data: UpdatePlanDto & { modify_by: number }): Promise<Plan> {
    Object.assign(plan, data);
    plan.modify_by = data.modify_by;
    return this.planRepository.save(plan);
  }

  async delete(plan: Plan, userId: number): Promise<void> {
    plan.is_deleted = true;
    plan.modify_by = userId;
    await this.planRepository.save(plan);
  }

  async assignModules(plan: Plan, moduleSlugs: string[]): Promise<Plan> {
    const modules = await this.moduleRepository.find({
      where: { slug: In(moduleSlugs), is_deleted: false },
    });

    if (modules.length !== moduleSlugs.length) {
      throw new Error('One or more modules not found');
    }

    plan.modules = modules;
    return this.planRepository.save(plan);
  }
}

