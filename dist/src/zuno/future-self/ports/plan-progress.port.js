"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NullPlanProgressProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullPlanProgressProvider = exports.PLAN_PROGRESS_PROVIDER = void 0;
const common_1 = require("@nestjs/common");
exports.PLAN_PROGRESS_PROVIDER = Symbol('PLAN_PROGRESS_PROVIDER');
let NullPlanProgressProvider = NullPlanProgressProvider_1 = class NullPlanProgressProvider {
    constructor() {
        this.logger = new common_1.Logger(NullPlanProgressProvider_1.name);
    }
    async getCurrentPlan() {
        this.logger.debug('No Plan module bound to PLAN_PROGRESS_PROVIDER; Future Self will ground itself in challenge and memory only.');
        return null;
    }
    async getProgress() {
        return { completedActions: [], openLoops: [], observedPatterns: [] };
    }
};
exports.NullPlanProgressProvider = NullPlanProgressProvider;
exports.NullPlanProgressProvider = NullPlanProgressProvider = NullPlanProgressProvider_1 = __decorate([
    (0, common_1.Injectable)()
], NullPlanProgressProvider);
//# sourceMappingURL=plan-progress.port.js.map