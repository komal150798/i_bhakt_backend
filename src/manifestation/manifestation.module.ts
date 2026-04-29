import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestationLog } from './entities/manifestation-log.entity';
import { Manifestation } from './entities/manifestation.entity';
import { ManifestationProgressEntry } from './entities/manifestation-progress-entry.entity';
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
import { CacheModule } from '../cache/cache.module';
import { AstrologyModule } from '../astrology/astrology.module';
import { SwissEphemerisService } from '../astrology/services/swiss-ephemeris.service';
import { Customer } from '../users/entities/customer.entity';
import { HttpModule } from '@nestjs/axios';
import { ManifestationLLMAnalyzerService } from './services/manifestation-llm-analyzer.service';
import { ManifestationBackendConfigService } from './services/manifestation-backend-config.service';
import { ManifestationDbConfigService } from './services/manifestation-db-config.service';
import { ManifestationAlignmentService } from './services/manifestation-alignment.service';
import { ConstantsModule } from '../common/constants/constants.module';
import { AIPromptModule } from '../common/ai/ai-prompt.module';
import { DashaRecord } from '../database/entities/dasha-record.entity';
import { AntardashaRecord } from '../database/entities/antardasha-record.entity';
import { PratyantarDashaRecord } from '../database/entities/pratyantar-dasha-record.entity';
import { SukshmaDashaRecord } from '../database/entities/sukshma-dasha-record.entity';
import { KundliModule } from '../kundli/kundli.module';
import { Kundli } from '../kundli/entities/kundli.entity';
import { KundliPlanet } from '../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../kundli/entities/kundli-house.entity';
import { SeedManifestationMasterDataService } from './seeds/seed-manifestation-master-data.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManifestationLog,
      Manifestation,
      ManifestationProgressEntry,
      Customer,
      DashaRecord, // For Dasha period analysis
      AntardashaRecord,
      PratyantarDashaRecord,
      SukshmaDashaRecord,
      Kundli, // For kundli data
      KundliPlanet, // For planetary positions
      KundliHouse, // For house positions
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
    KundliModule, // For kundli calculation
    ConstantsModule, // Central Constants Service
    AIPromptModule, // AI Prompt Service
    SubscriptionsModule,
  ],
  controllers: [AppManifestationController],
  providers: [
    ManifestationService,
    ManifestationEnhancedService,
    ManifestationAIEvaluationService,
    ManifestationLLMAnalyzerService,
    ManifestationBackendConfigService,
    ManifestationDbConfigService, // New database-driven config service
    ManifestationAlignmentService, // Kundli alignment service
    SeedManifestationMasterDataService, // Seed service for master data
  ],
  exports: [ManifestationService, ManifestationEnhancedService, ManifestationDbConfigService],
})
export class ManifestationModule {}





