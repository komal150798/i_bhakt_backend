import { JournalService } from '../journal.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { GetJournalEntriesDto } from '../dto/get-journal-entries.dto';
export declare class AppJournalController {
    private readonly journalService;
    constructor(journalService: JournalService);
    createJournalEntry(dto: CreateJournalEntryDto, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            content: string;
            entry_date: Date;
            entry_type: string;
            sentiment: {
                sentiment: string;
                score: number;
                emotions?: string[];
            };
            karma_entry_id: number;
            created_at: Date;
        };
    }>;
    getJournalEntries(query: GetJournalEntriesDto, user: any): Promise<{
        success: boolean;
        data: {
            entries: {
                id: number;
                content: string;
                entry_date: Date;
                entry_type: string;
                sentiment: {
                    sentiment: string;
                    score: number;
                    emotions?: string[];
                };
                karma_entry_id: number;
                created_at: Date;
            }[];
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    getJournalEntry(id: number, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            content: string;
            entry_date: Date;
            entry_type: string;
            sentiment: {
                sentiment: string;
                score: number;
                emotions?: string[];
            };
            nlp_analysis: {
                keywords?: string[];
                topics?: string[];
                summary?: string;
            };
            karma_entry_id: number;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    updateJournalEntry(id: number, dto: Partial<CreateJournalEntryDto>, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            content: string;
            entry_type: string;
            updated_at: Date;
        };
    }>;
    deleteJournalEntry(id: number, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
