import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalService } from './journal.service';
import { AppJournalController } from './controllers/app-journal.controller';
import { KarmaModule } from '../karma/karma.module';
import { ConstantsModule } from '../common/constants/constants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntry]),
    KarmaModule, // Import to use KarmaService
    ConstantsModule, // Central Constants Service
  ],
  controllers: [AppJournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}


