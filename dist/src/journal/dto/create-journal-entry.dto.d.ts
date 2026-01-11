export declare enum JournalEntryType {
    GRATITUDE = "gratitude",
    REFLECTION = "reflection",
    GOAL = "goal",
    GENERAL = "general",
    LEDGER = "ledger"
}
export declare class CreateJournalEntryDto {
    content: string;
    entry_date?: string;
    entry_type?: JournalEntryType;
    metadata?: Record<string, any>;
}
