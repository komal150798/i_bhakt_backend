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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let PlansService = class PlansService {
    constructor(planRepository, cacheManager) {
        this.planRepository = planRepository;
        this.cacheManager = cacheManager;
        this.CACHE_TTL = 3600;
        this.CACHE_KEY_PREFIX = 'plans:';
    }
    async create(createPlanDto, userId) {
        const existing = await this.planRepository.findByPlanType(createPlanDto.plan_type);
        if (existing) {
            throw new common_1.ConflictException(`Plan with type "${createPlanDto.plan_type}" already exists`);
        }
        const plan = await this.planRepository.create({
            ...createPlanDto,
            added_by: userId,
            modify_by: userId,
        });
        await this.invalidateCache();
        return this.toResponseDto(plan);
    }
    async findAll(options) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}all:${options?.is_enabled ?? 'all'}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const plans = await this.planRepository.findAll({
            is_enabled: options?.is_enabled,
            is_deleted: false,
        });
        const response = plans.map((p) => this.toResponseDto(p));
        await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
        return response;
    }
    async resolveSubscribablePlan(params) {
        const hasId = params.plan_id !== undefined && params.plan_id !== null;
        const hasUnique = params.unique_id !== undefined &&
            params.unique_id !== null &&
            String(params.unique_id).trim() !== '';
        if (!hasId && !hasUnique) {
            throw new common_1.BadRequestException('Provide plan_id or unique_id');
        }
        let plan = null;
        if (hasId) {
            plan = await this.planRepository.findById(Number(params.plan_id));
        }
        else {
            plan = await this.planRepository.findByUniqueId(String(params.unique_id).trim());
        }
        if (!plan || plan.is_deleted || !plan.is_enabled) {
            throw new common_1.NotFoundException('Plan not found or not available');
        }
        return plan;
    }
    async findOneByUniqueId(uniqueId) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}unique:${uniqueId}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const plan = await this.planRepository.findByUniqueId(uniqueId);
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with unique ID ${uniqueId} not found`);
        }
        const response = this.toResponseDto(plan);
        await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);
        return response;
    }
    async update(uniqueId, updatePlanDto, userId) {
        const plan = await this.planRepository.findByUniqueId(uniqueId);
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with unique ID ${uniqueId} not found`);
        }
        if (updatePlanDto.plan_type && updatePlanDto.plan_type !== plan.plan_type) {
            const existing = await this.planRepository.findByPlanType(updatePlanDto.plan_type);
            if (existing) {
                throw new common_1.ConflictException(`Plan with type "${updatePlanDto.plan_type}" already exists`);
            }
        }
        const updated = await this.planRepository.update(plan, {
            ...updatePlanDto,
            modify_by: userId,
        });
        await this.invalidateCache();
        return this.toResponseDto(updated);
    }
    async assignModules(uniqueId, moduleSlugs, userId) {
        const plan = await this.planRepository.findByUniqueId(uniqueId);
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with unique ID ${uniqueId} not found`);
        }
        const updated = await this.planRepository.assignModules(plan, moduleSlugs);
        plan.modify_by = userId;
        await this.planRepository.update(plan, { modify_by: userId });
        await this.invalidateCache();
        return this.toResponseDto(updated);
    }
    async remove(uniqueId, userId) {
        const plan = await this.planRepository.findByUniqueId(uniqueId);
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with unique ID ${uniqueId} not found`);
        }
        await this.planRepository.delete(plan, userId);
        await this.invalidateCache();
    }
    async invalidateCache() {
        const keys = await this.cacheManager.store?.keys?.(`${this.CACHE_KEY_PREFIX}*`);
        if (keys && Array.isArray(keys)) {
            await Promise.all(keys.map((key) => this.cacheManager.del(key)));
        }
    }
    toResponseDto(plan) {
        return {
            id: Number(plan.id),
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
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IPlanRepository')),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, Object])
], PlansService);
//# sourceMappingURL=plans.service.js.map