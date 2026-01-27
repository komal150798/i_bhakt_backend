import { KarmaService } from '../services/karma.service';
export declare class AppKarmaController {
    private readonly karmaService;
    constructor(karmaService: KarmaService);
    getTodayKarma(user: any): Promise<{
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
    addKarmaInput(body: {
        action_text: string;
        timestamp?: string;
    }, user: any): Promise<{
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
    recordKarma(body: {
        action_text: string;
        karma_type: 'good' | 'neutral' | 'challenging';
        timestamp?: string;
    }, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            action_text: string;
            karma_type: "good" | "neutral" | "challenging";
            karma_type_internal: import("../../common/enums/karma-type.enum").KarmaType;
            score: number;
            category: string;
            created_at: Date;
            insight: {
                alignment_percentage: number;
                alignment_status: string;
                phase_impact: string;
                insight_description: string;
                footer_message: string;
            };
        };
    }>;
    getKarmaScores(user: any): Promise<{
        success: boolean;
        data: {
            current_score: number;
            weekly_score: any;
            monthly_score: any;
            trend: "improving" | "declining" | "stable";
            grade: string;
        };
    }>;
    getDashboard(user: any): Promise<{
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
    getKarmaLedger(user: any): Promise<{
        success: boolean;
        data: {
            current_awareness_level: number;
            karma_distribution: {
                supportive: number;
                neutral: number;
                learning: number;
            };
            alignment_tips: string[];
            footer_message: string;
        };
    }>;
    getKarmaList(filter: string, limit: string, offset: string, user: any): Promise<{
        success: boolean;
        data: {
            total: number;
            entries: Array<{
                id: number;
                karma_type: string;
                action_text: string;
                date: Date;
                score: number;
                category: string | null;
            }>;
        };
    }>;
    getKarmaPatterns(filter: string, user: any): Promise<{
        success: boolean;
        data: {
            filter: string;
            awareness_over_time: Array<{
                date: string;
                awareness_level: number;
                good_actions: number;
                neutral_actions: number;
                challenging_actions: number;
                total_actions: number;
            }>;
            footer_message: string;
        };
    }>;
    getKarmaInsight(id: number, user: any): Promise<{
        success: boolean;
        data: {
            alignment_percentage: number;
            alignment_status: string;
            phase_impact: string;
            insight_description: string;
            footer_message: string;
        };
    }>;
    getKarmaEntry(id: number, user: any): Promise<{
        success: boolean;
        data: any;
    }>;
    private getKarmaGrade;
}
