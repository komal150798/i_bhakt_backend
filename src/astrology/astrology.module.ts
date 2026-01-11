import { Module } from '@nestjs/common';
import { SwissEphemerisService } from './services/swiss-ephemeris.service';
import { AIKundliService } from './services/ai-kundli.service';
import { AIPromptModule } from '../common/ai/ai-prompt.module';

@Module({
  imports: [AIPromptModule],
  providers: [SwissEphemerisService, AIKundliService],
  exports: [SwissEphemerisService, AIKundliService],
})
export class AstrologyModule {}

