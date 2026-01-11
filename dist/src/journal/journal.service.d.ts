import { Repository } from 'typeorm';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { GetJournalEntriesDto } from './dto/get-journal-entries.dto';
import { KarmaService } from '../karma/services/karma.service';
import { ConstantsService } from '../common/constants/constants.service';
export declare class JournalService {
    private journalRepository;
    private karmaService;
    private constantsService;
    constructor(journalRepository: Repository<JournalEntry>, karmaService: KarmaService, constantsService: ConstantsService);
    createJournalEntry(userId: number, dto: CreateJournalEntryDto): Promise<JournalEntry>;
    getJournalEntries(userId: number, dto: GetJournalEntriesDto): Promise<{
        entries: JournalEntry[];
        total: number;
    }>;
    getJournalEntryById(userId: number, entryId: number): Promise<JournalEntry>;
    updateJournalEntry(userId: number, entryId: number, updateData: Partial<CreateJournalEntryDto>): Promise<JournalEntry>;
    deleteJournalEntry(userId: number, entryId: number): Promise<void>;
    private analyzeSentiment;
    private extractKeywords;
}
