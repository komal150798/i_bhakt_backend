import { ChallengesService } from '../challenges.service';
export declare class AppChallengesController {
    private readonly challengesService;
    constructor(challengesService: ChallengesService);
    getChallenges(user: any): Promise<{
        success: boolean;
        data: {
            available: {
                id: number;
                title: string;
                description: string;
                challenge_type: string;
                duration_days: number;
                daily_tasks: {
                    day: number;
                    task: string;
                    description?: string;
                }[];
            }[];
            user_challenges: {
                id: number;
                challenge_id: number;
                challenge_title: string;
                start_date: Date;
                end_date: Date;
                status: string;
                current_day: number;
                completed_days: number[];
            }[];
        };
    }>;
    getChallenge(id: number, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            title: string;
            description: string;
            challenge_type: string;
            duration_days: number;
            daily_tasks: {
                day: number;
                task: string;
                description?: string;
            }[];
            user_progress: {
                status: any;
                current_day: any;
                completed_days: any;
                start_date: any;
                end_date: any;
            };
        };
    }>;
    startChallenge(id: number, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            challenge_id: number;
            start_date: Date;
            end_date: Date;
            status: string;
            current_day: number;
        };
    }>;
    markDayComplete(body: {
        challenge_id: number;
        day: number;
    }, user: any): Promise<{
        success: boolean;
        data: {
            challenge_id: number;
            current_day: number;
            completed_days: number[];
            status: string;
            is_completed: boolean;
        };
    }>;
}
