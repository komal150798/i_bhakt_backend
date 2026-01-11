import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { KarmaCategory } from '../entities/karma-category.entity';
import { KarmaWeightRule } from '../entities/karma-weight-rule.entity';
import { KarmaHabitSuggestion } from '../entities/karma-habit-suggestion.entity';
export declare class SeedKarmaMasterDataService implements OnModuleInit {
    private readonly categoryRepository;
    private readonly weightRuleRepository;
    private readonly habitRepository;
    private readonly logger;
    constructor(categoryRepository: Repository<KarmaCategory>, weightRuleRepository: Repository<KarmaWeightRule>, habitRepository: Repository<KarmaHabitSuggestion>);
    onModuleInit(): Promise<void>;
    private seedCategories;
    private seedWeightRules;
    private seedHabitSuggestions;
}
