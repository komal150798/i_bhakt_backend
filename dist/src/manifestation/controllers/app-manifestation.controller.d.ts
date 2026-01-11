import { ManifestationService } from '../manifestation.service';
import { CreateManifestationDto } from '../dto/create-manifestation.dto';
export declare class AppManifestationController {
    private readonly manifestationService;
    constructor(manifestationService: ManifestationService);
    createManifestation(dto: CreateManifestationDto, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            title: string;
            clarity: number;
            coherence: number;
            mfp_score: number;
            astro_index: number;
            best_manifestation_date: Date;
            analysis_data: Record<string, any>;
            created_at: Date;
        };
    }>;
    getManifestations(user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            title: string;
            clarity: number;
            coherence: number;
            mfp_score: number;
            astro_index: number;
            best_manifestation_date: Date;
            is_locked: any;
            created_at: Date;
        }[];
    }>;
    getManifestation(id: number, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            title: string;
            clarity: number;
            coherence: number;
            mfp_score: number;
            astro_index: number;
            best_manifestation_date: Date;
            analysis_data: Record<string, any>;
            is_locked: any;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    updateManifestation(id: number, body: {
        is_locked?: boolean;
        metadata?: Record<string, any>;
    }, user: any): Promise<{
        success: boolean;
        data: {
            id: number;
            is_locked: any;
            updated_at: Date;
        };
    }>;
    deleteManifestation(id: number, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
