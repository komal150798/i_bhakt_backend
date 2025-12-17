import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestationLog } from './entities/manifestation-log.entity';
import { Manifestation } from './entities/manifestation.entity';
import {
  ManifestCategory,
  ManifestSubcategory,
  ManifestKeyword,
  ManifestEnergyRule,
  ManifestRitualTemplate,
  ManifestToManifestTemplate,
  ManifestNotToManifestTemplate,
  ManifestAlignmentTemplate,
  ManifestInsightTemplate,
  ManifestSummaryTemplate,
  ManifestBackendCache,
  ManifestUserLog,
} from './entities';
import { ManifestationService } from './manifestation.service';
import { ManifestationEnhancedService } from './services/manifestation-enhanced.service';
import { ManifestationAIEvaluationService } from './services/manifestation-ai-evaluation.service';
import { AppManifestationController } from './controllers/app-manifestation.controller';
import { AppManifestationEnhancedController } from './controllers/app-manifestation-enhanced.controller';
import { CacheModule } from '../cache/cache.module';
import { AstrologyModule } from '../astrology/astrology.module';
import { User } from '../users/entities/user.entity';
import { Customer } from '../users/entities/customer.entity';
import { HttpModule } from '@nestjs/axios';
import { ManifestationLLMAnalyzerService } from './services/manifestation-llm-analyzer.service';
import { ManifestationBackendConfigService } from './services/manifestation-backend-config.service';
import { ManifestationDbConfigService } from './services/manifestation-db-config.service';
import { ConstantsModule } from '../common/constants/constants.module';
import { AIPromptModule } from '../common/ai/ai-prompt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManifestationLog,
      Manifestation,
      User,
      Customer,
      // New database-driven AI system entities
      ManifestCategory,
      ManifestSubcategory,
      ManifestKeyword,
      ManifestEnergyRule,
      ManifestRitualTemplate,
      ManifestToManifestTemplate,
      ManifestNotToManifestTemplate,
      ManifestAlignmentTemplate,
      ManifestInsightTemplate,
      ManifestSummaryTemplate,
      ManifestBackendCache,
      ManifestUserLog,
    ]),
    HttpModule, // For LLM API calls
    CacheModule,
    AstrologyModule, // For Swiss Ephemeris service
    ConstantsModule, // Central Constants Service
    AIPromptModule, // AI Prompt Service
  ],
  controllers: [AppManifestationController, AppManifestationEnhancedController],
  providers: [
    ManifestationService,
    ManifestationEnhancedService,
    ManifestationAIEvaluationService,
    ManifestationLLMAnalyzerService,
    ManifestationBackendConfigService,
    ManifestationDbConfigService, // New database-driven config service
  ],
  exports: [ManifestationService, ManifestationEnhancedService, ManifestationDbConfigService],
})
export class ManifestationModule {}





