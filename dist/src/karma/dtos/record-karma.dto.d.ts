export declare enum KarmaTypeInput {
    GOOD = "good",
    NEUTRAL = "neutral",
    CHALLENGING = "challenging"
}
export declare class RecordKarmaDto {
    karma_type: KarmaTypeInput;
    description: string;
    intention?: string;
    emotional_context?: string;
}
