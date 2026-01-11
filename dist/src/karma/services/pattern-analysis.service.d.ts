import { Repository } from 'typeorm';
import { KarmaPattern } from '../entities/karma-pattern.entity';
import { IKarmaRepository } from '../../core/interfaces/repositories/karma-repository.interface';
export interface PatternAnalysisResult {
    detected_patterns: Array<{
        pattern_key: string;
        pattern_name: string;
        pattern_type: 'good' | 'bad' | 'neutral';
        frequency: number;
        total_impact: number;
        first_detected: Date;
        last_detected: Date;
        sample_actions: string[];
    }>;
    strengths: string[];
    weaknesses: string[];
    dominant_emotion: string;
    behavioral_insights: string;
}
export declare class PatternAnalysisService {
    private readonly karmaRepository;
    private readonly patternRepository;
    private readonly logger;
    constructor(karmaRepository: IKarmaRepository, patternRepository: Repository<KarmaPattern>);
    analyzeUserPatterns(userId: number): Promise<PatternAnalysisResult>;
    private generateBehavioralInsights;
    private savePatternsToDatabase;
    getUserPatterns(userId: number): Promise<KarmaPattern[]>;
}
