import { DataSource, Repository } from 'typeorm';
import { ZunoPlan } from '../entities/zuno-plan.entity';
import { ZunoPlanItem } from '../entities/zuno-plan-item.entity';
import { ZunoPlanItemEvent } from '../entities/zuno-plan-item-event.entity';
import { ZunoChallenge } from '../../challenges/entities/zuno-challenge.entity';
import { ZunoUser } from '../../identity/entities/zuno-user.entity';
import { MkaService } from '../../mka/services/mka.service';
import { SafetyService } from '../../safety/services/safety.service';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ClockService } from '../../common/services/clock.service';
import { PlanItemCategory, PlanItemEventSource, PlanItemPriority, PlanItemRealignmentPolicy, PlanItemScenarioScope, PlanItemSource, PlanItemStatus, PlanStatus, PlanType } from '../enums/plan.enum';
import { CapacityUsage, PlanCapacityLimits } from '../enums/plan-capacity';
export interface GeneratePlanParams {
    user: ZunoUser;
    challengeId: string;
    planType?: PlanType;
    regenerate?: boolean;
    reason?: string;
}
export interface PlanWithItems {
    plan: ZunoPlan;
    items: ZunoPlanItem[];
}
export interface TransitionItemParams {
    user: ZunoUser;
    itemId: string;
    to: PlanItemStatus;
    reason?: string;
    note?: string;
    deferredTo?: string;
    source?: PlanItemEventSource;
    expectedVersion?: number;
}
interface PlanItemCandidate {
    title: string;
    description: string | null;
    whyThisMatters: string | null;
    category: PlanItemCategory;
    priority: PlanItemPriority;
    isPractice: boolean;
    estimatedMinutes: number | null;
    sourceType: PlanItemSource;
    sourceRefId: string | null;
    mkaItemId: string | null;
    scenarioScope: PlanItemScenarioScope;
    karmaEligible: boolean;
    realignmentPolicy: PlanItemRealignmentPolicy;
    scheduledDate: string | null;
    dueAt: Date | null;
}
export declare class PlanService {
    private readonly plans;
    private readonly items;
    private readonly itemEvents;
    private readonly challenges;
    private readonly mka;
    private readonly safety;
    private readonly outbox;
    private readonly audit;
    private readonly ownership;
    private readonly clock;
    private readonly dataSource;
    private readonly logger;
    constructor(plans: Repository<ZunoPlan>, items: Repository<ZunoPlanItem>, itemEvents: Repository<ZunoPlanItemEvent>, challenges: Repository<ZunoChallenge>, mka: MkaService, safety: SafetyService, outbox: OutboxService, audit: ZunoAuditService, ownership: ZunoOwnershipService, clock: ClockService, dataSource: DataSource);
    generate(params: GeneratePlanParams): Promise<PlanWithItems>;
    enforceCapacity(candidates: PlanItemCandidate[], limits: PlanCapacityLimits): {
        active: PlanItemCandidate[];
        overflow: PlanItemCandidate[];
    };
    currentUsage(planId: string): Promise<CapacityUsage>;
    addItem(user: ZunoUser, planId: string, input: {
        title: string;
        description?: string;
        category?: PlanItemCategory;
        priority?: PlanItemPriority;
        estimatedMinutes?: number;
        scheduledDate?: string;
        isCommitment?: boolean;
    }): Promise<ZunoPlanItem>;
    private candidatesFromMka;
    private rank;
    private categoryFor;
    private priorityFor;
    private sourceFor;
    private toRow;
    transitionItem(params: TransitionItemParams): Promise<ZunoPlanItem>;
    completeItem(user: ZunoUser, itemId: string, options?: {
        note?: string;
    }): Promise<ZunoPlanItem>;
    deferItem(user: ZunoUser, itemId: string, options?: {
        to?: string;
        reason?: string;
    }): Promise<ZunoPlanItem>;
    skipItem(user: ZunoUser, itemId: string, options?: {
        reason?: string;
    }): Promise<ZunoPlanItem>;
    startItem(user: ZunoUser, itemId: string): Promise<ZunoPlanItem>;
    blockItem(user: ZunoUser, itemId: string, reason: string): Promise<ZunoPlanItem>;
    private assertDependenciesSatisfied;
    assertTransition(from: PlanItemStatus, to: PlanItemStatus): PlanItemStatus;
    activate(user: ZunoUser, planId: string, expectedVersion?: number): Promise<ZunoPlan>;
    patch(user: ZunoUser, planId: string, input: {
        title?: string;
        primaryGoal?: string;
        status?: PlanStatus;
        version?: number;
    }): Promise<ZunoPlan>;
    private supersede;
    assertPlanTransition(from: PlanStatus, to: PlanStatus): PlanStatus;
    findOwnedChallenge(userId: string, challengeId: string): Promise<ZunoChallenge>;
    findOwnedPlan(userId: string, planId: string): Promise<ZunoPlan>;
    findOwnedItem(userId: string, itemId: string): Promise<ZunoPlanItem>;
    findActivePlan(userId: string, challengeId: string, planType: PlanType): Promise<ZunoPlan | null>;
    itemsFor(planId: string): Promise<ZunoPlanItem[]>;
    detail(user: ZunoUser, planId: string): Promise<PlanWithItems>;
    listForChallenge(user: ZunoUser, challengeId: string): Promise<ZunoPlan[]>;
    list(userId: string): Promise<ZunoPlan[]>;
    historyFor(user: ZunoUser, itemId: string): Promise<ZunoPlanItemEvent[]>;
    private recordItemEvent;
    private horizonWindow;
    private planTitle;
}
export {};
