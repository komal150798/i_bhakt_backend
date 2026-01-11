import { KarmaService, AddKarmaActionDto, KarmaSummaryDto } from '../../karma/services/karma.service';
export declare class KarmaController {
    private readonly karmaService;
    constructor(karmaService: KarmaService);
    addKarmaAction(dto: AddKarmaActionDto, req: any): Promise<import("../../karma/entities/karma-entry.entity").KarmaEntry>;
    getUserKarmaSummary(body: {
        user_id?: number;
    }, req: any): Promise<KarmaSummaryDto>;
    getUserHabits(body: {
        user_id?: number;
    }, req: any): Promise<import("../../karma/services/habit-recommendation.service").HabitPlan>;
    getUserPatterns(body: {
        user_id?: number;
    }, req: any): Promise<import("../../karma/services/pattern-analysis.service").PatternAnalysisResult>;
    getWeeklyInsights(body: {
        user_id?: number;
    }, req: any): Promise<any>;
    getMonthlyInsights(body: {
        user_id?: number;
    }, req: any): Promise<any>;
    getDashboard(req: any): Promise<any>;
}
