"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("../../plans/entities/plan.entity");
const module_entity_1 = require("../../modules/entities/module.entity");
let PlanRepository = class PlanRepository {
    constructor(planRepository, moduleRepository) {
        this.planRepository = planRepository;
        this.moduleRepository = moduleRepository;
    }
    async findById(id) {
        return this.planRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['modules'],
        });
    }
    async findByUniqueId(uniqueId) {
        return this.planRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
            relations: ['modules'],
        });
    }
    async findByPlanType(planType) {
        return this.planRepository.findOne({
            where: { plan_type: planType, is_deleted: false },
            relations: ['modules'],
        });
    }
    async findAll(options) {
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
    async create(data) {
        const plan = this.planRepository.create({
            ...data,
            added_by: data.added_by,
            modify_by: data.modify_by,
        });
        return this.planRepository.save(plan);
    }
    async update(plan, data) {
        Object.assign(plan, data);
        plan.modify_by = data.modify_by;
        return this.planRepository.save(plan);
    }
    async delete(plan, userId) {
        plan.is_deleted = true;
        plan.modify_by = userId;
        await this.planRepository.save(plan);
    }
    async assignModules(plan, moduleSlugs) {
        const modules = await this.moduleRepository.find({
            where: { slug: (0, typeorm_2.In)(moduleSlugs), is_deleted: false },
        });
        if (modules.length !== moduleSlugs.length) {
            throw new Error('One or more modules not found');
        }
        plan.modules = modules;
        return this.planRepository.save(plan);
    }
};
exports.PlanRepository = PlanRepository;
exports.PlanRepository = PlanRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(module_entity_1.Module)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PlanRepository);
//# sourceMappingURL=plan.repository.js.map