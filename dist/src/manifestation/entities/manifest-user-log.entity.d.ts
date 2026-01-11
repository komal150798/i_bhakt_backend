export declare class ManifestUserLog {
    id: string;
    user_id: string;
    manifestation_title: string;
    manifestation_text: string;
    detected_category: string;
    detected_subcategory: string | null;
    energy_state: string;
    ai_output_json: Record<string, any>;
    created_at: Date;
}
