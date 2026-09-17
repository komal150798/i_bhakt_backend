"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NoopRealignmentTarget_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopRealignmentTarget = void 0;
const common_1 = require("@nestjs/common");
let NoopRealignmentTarget = NoopRealignmentTarget_1 = class NoopRealignmentTarget {
    constructor() {
        this.logger = new common_1.Logger(NoopRealignmentTarget_1.name);
    }
    async loadCurrentDirection(ctx) {
        this.logger.debug(`No realignment target bound; realignment ${ctx.realignmentId} will record a decision only.`);
        return {
            planId: null,
            planVersion: null,
            mkaProgramId: null,
            pendingItemIds: [],
            pendingReminderIds: [],
            assumptions: [],
            available: false,
        };
    }
    async cancelPendingItems() {
        return { cancelledItemIds: [], applied: false };
    }
    async supersedeProgramme() {
        return {
            supersededProgramId: null,
            successorProgramId: null,
            applied: false,
        };
    }
    async suppressPendingReminders() {
        return { suppressedReminderIds: [], applied: false };
    }
    async activateSuccessorPlan() {
        return {
            planId: null,
            planVersion: null,
            archivedPlanId: null,
            applied: false,
        };
    }
};
exports.NoopRealignmentTarget = NoopRealignmentTarget;
exports.NoopRealignmentTarget = NoopRealignmentTarget = NoopRealignmentTarget_1 = __decorate([
    (0, common_1.Injectable)()
], NoopRealignmentTarget);
//# sourceMappingURL=noop-realignment-target.js.map