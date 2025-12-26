import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AIPrompt } from './entities/ai-prompt.entity';
import { PromptService } from './prompt.service';
import { LLMService } from './services/llm.service';
import { CacheModule } from '../../cache/cache.module';
import { AdminAIPromptController } from './controllers/admin-ai-prompt.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIPrompt]),
    HttpModule, // For LLM API calls
    CacheModule, // For Redis access
  ],
  controllers: [AdminAIPromptController],
  providers: [PromptService, LLMService],
  exports: [PromptService, LLMService, TypeOrmModule], // Export for use in other modules
})
export class AIPromptModule {}
