"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planCapacityFor = planCapacityFor;
exports.measureCapacity = measureCapacity;
exports.wouldExceedCapacity = wouldExceedCapacity;
const common_1 = require("@nestjs/common");
const plan_enum_1 = require("./plan.enum");
const DEFAULT_PLAN_CAPACITY = {
    [plan_enum_1.PlanType.TODAY]: {
        maxActions: 3,
        minActions: 1,
        maxEssential: 1,
        maxPractices: 2,
        maxEstimatedMinutes: 180,
    },
    [plan_enum_1.PlanType.WEEKLY]: {
        maxActions: 7,
        minActions: 3,
        maxEssential: 2,
        maxPractices: 3,
        maxEstimatedMinutes: 900,
    },
    [plan_enum_1.PlanType.THIRTY_DAY]: {
        maxActions: 28,
        minActions: 4,
        maxEssential: 4,
        maxPractices: 4,
        maxEstimatedMinutes: 3600,
    },
    [plan_enum_1.PlanType.LONG_TERM]: {
        maxActions: 12,
        minActions: 2,
        maxEssential: 2,
        maxPractices: 2,
        maxEstimatedMinutes: 2400,
    },
    [plan_enum_1.PlanType.CUSTOM]: {
        maxActions: 7,
        minActions: 1,
        maxEssential: 2,
        maxPractices: 3,
        maxEstimatedMinutes: 900,
    },
};
const logger = new common_1.Logger('PlanCapacity');
function planCapacityFor(planType) {
    const base = DEFAULT_PLAN_CAPACITY[planType] ?? DEFAULT_PLAN_CAPACITY[plan_enum_1.PlanType.CUSTOM];
    const raw = process.env.ZUNO_PLAN_CAPACITY_JSON;
    if (!raw)
        return base;
    try {
        const parsed = JSON.parse(raw);
        const override = parsed[planType];
        if (!override || typeof override !== 'object')
            return base;
        const merged = { ...base };
        for (const key of Object.keys(merged)) {
            const value = override[key];
            if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
                merged[key] = Math.floor(value);
            }
        }
        if (merged.maxActions < 1)
            merged.maxActions = base.maxActions;
        return merged;
    }
    catch {
        logger.warn('ZUNO_PLAN_CAPACITY_JSON is not valid JSON; falling back to the specification defaults.');
        return base;
    }
}
function measureCapacity(items) {
    return items.reduce((usage, item) => ({
        actions: usage.actions + (item.isPractice ? 0 : 1),
        essentials: usage.essentials +
            (!item.isPractice && item.priority === plan_enum_1.PlanItemPriority.ESSENTIAL ? 1 : 0),
        practices: usage.practices + (item.isPractice ? 1 : 0),
        estimatedMinutes: usage.estimatedMinutes + (item.estimatedMinutes ?? 0),
    }), { actions: 0, essentials: 0, practices: 0, estimatedMinutes: 0 });
}
function wouldExceedCapacity(usage, limits, candidate) {
    if (candidate.isPractice)
        return usage.practices >= limits.maxPractices;
    return usage.actions >= limits.maxActions;
}
//# sourceMappingURL=plan-capacity.js.map