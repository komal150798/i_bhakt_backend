import { JournalEntryType } from './create-journal-entry.dto';
export declare class GetJournalEntriesDto {
    from?: string;
    to?: string;
    type?: JournalEntryType;
    limit?: number;
    offset?: number;
}
