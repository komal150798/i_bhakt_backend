import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
export declare class AppController {
    private readonly plansService;
    constructor(plansService: PlansService);
    getPlans(): Promise<PlanResponseDto[]>;
    getPlan(uniqueId: string): Promise<PlanResponseDto>;
}
