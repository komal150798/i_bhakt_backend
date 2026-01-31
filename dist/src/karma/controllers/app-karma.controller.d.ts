import { KarmaService } from '../services/karma.service';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { AddKarmaInputDto } from '../dtos/add-karma-input.dto';
export declare class AppKarmaController {
    private readonly karmaService;
    constructor(karmaService: KarmaService);
    getTodayKarma(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            karma_score: any;
            today_input_submitted: boolean;
            today_input_prompt: string;
            streak: number;
            weekly_heatmap: any[];
            daily_alignment_tip: any;
        };
    }>;
    addKarmaInput(inputDto: AddKarmaInputDto, user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            id: number;
            action_text: string;
            karma_type: import("../../common/enums/karma-type.enum").KarmaType;
            score: number;
            category: string;
            created_at: Date;
        };
    }>;
    getKarmaScores(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            current_score: number;
            weekly_score: any;
            monthly_score: any;
            trend: "improving" | "declining" | "stable";
            grade: string;
        };
    }>;
    getDashboard(user: CurrentUserPayload): Promise<{
        success: boolean;
        data: {
            karma_score: any;
            karma_grade: any;
            trend: any;
            total_actions: any;
            recent_actions: any;
            patterns: any;
            improvement_plan: any;
            weekly_trend: any;
            monthly_trend: any;
            streak: any;
        };
    }>;
    private getKarmaGrade;
}
