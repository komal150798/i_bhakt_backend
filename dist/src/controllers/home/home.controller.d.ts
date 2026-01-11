import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
export declare class HomeController {
    private readonly plansService;
    constructor(plansService: PlansService);
    getPlans(enabled?: string): Promise<PlanResponseDto[]>;
    getPlan(uniqueId: string): Promise<PlanResponseDto>;
}
