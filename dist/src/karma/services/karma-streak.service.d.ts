import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
export interface KarmaStreak {
    current_streak_days: number;
    longest_streak_days: number;
    level: 'awaken' | 'builder' | 'pro' | 'master';
    level_name: string;
    next_level_threshold: number;
    progress_to_next_level: number;
}
export declare class KarmaStreakService {
    private readonly karmaRepository;
    private readonly logger;
    constructor(karmaRepository: IKarmaRepository);
    calculateStreak(userId: number): Promise<KarmaStreak>;
    private determineLevel;
    private getLevelInfo;
}
