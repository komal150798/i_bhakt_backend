import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KarmaEntry } from './entities/karma-entry.entity';
import { KarmaMasterGood } from './entities/karma-master-good.entity';
import { KarmaMasterBad } from './entities/karma-master-bad.entity';
import { KarmaCategory } from './entities/karma-category.entity';
import { KarmaWeightRule } from './entities/karma-weight-rule.entity';
import { KarmaHabitSuggestion } from './entities/karma-habit-suggestion.entity';
import { KarmaPattern } from './entities/karma-pattern.entity';
import { KarmaScoreSummary } from './entities/karma-score-summary.entity';
import { Customer } from '../users/entities/customer.entity';
import { AIClassificationService } from './services/ai-classification.service';
import { KarmaScoreService } from './services/karma-score.service';
import { PatternAnalysisService } from './services/pattern-analysis.service';
import { HabitRecommendationService } from './services/habit-recommendation.service';
import { KarmaService } from './services/karma.service';
import { KarmaStreakService } from './services/karma-streak.service';
import { SeedKarmaMasterDataService } from './seeds/seed-karma-master-data.service';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { AppKarmaController } from './controllers/app-karma.controller';
import { AIPromptModule } from '../common/ai/ai-prompt.module';
import { ConstantsModule } from '../common/constants/constants.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KarmaEntry,
      KarmaMasterGood,
      KarmaMasterBad,
      KarmaCategory,
      KarmaWeightRule,
      KarmaHabitSuggestion,
      KarmaPattern,
      KarmaScoreSummary,
      Customer, // Add Customer entity for validation
    ]),
    RepositoriesModule,
    AIPromptModule, // AI Prompt Service
    ConstantsModule, // Constants Service
    HttpModule, // For LLM API calls
  ],
  controllers: [AppKarmaController],
  providers: [
    AIClassificationService,
    KarmaScoreService,
    PatternAnalysisService,
    HabitRecommendationService,
    KarmaService,
    KarmaStreakService,
    SeedKarmaMasterDataService,
  ],
  exports: [
    AIClassificationService,
    KarmaScoreService,
    PatternAnalysisService,
    HabitRecommendationService,
    KarmaService,
    KarmaStreakService,
  ],
})
export class KarmaModule {}
