export declare enum ManifestationCategory {
    RELATIONSHIP = "relationship",
    CAREER = "career",
    MONEY = "money",
    HEALTH = "health",
    SPIRITUAL = "spiritual"
}
export declare enum EmotionalState {
    GRATEFUL = "grateful",
    HOPEFUL = "hopeful",
    CONFIDENT = "confident",
    ANXIOUS = "anxious",
    FRUSTRATED = "frustrated",
    PEACEFUL = "peaceful",
    EXCITED = "excited"
}
export declare class CreateManifestationEnhancedDto {
    title?: string;
    description: string;
    category?: ManifestationCategory;
    emotional_state?: EmotionalState;
    target_date?: string;
}
