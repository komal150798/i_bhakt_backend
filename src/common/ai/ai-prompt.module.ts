import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIPrompt } from './entities/ai-prompt.entity';
import { PromptService } from './prompt.service';
import { CacheModule } from '../../cache/cache.module';
import { AdminAIPromptController } from './controllers/admin-ai-prompt.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIPrompt]),
    CacheModule, // For Redis access
  ],
  controllers: [AdminAIPromptController],
  providers: [PromptService],
  exports: [PromptService, TypeOrmModule], // Export for use in other modules
})
export class AIPromptModule {}
