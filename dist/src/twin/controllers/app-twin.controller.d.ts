import { TwinStateService } from '../services/twin-state.service';
import { DigitalTwinService } from '../services/digital-twin.service';
import { CustomerService } from '../../users/services/customer.service';
export declare class AppTwinController {
    private readonly twinStateService;
    private readonly digitalTwinService;
    private readonly customerService;
    constructor(twinStateService: TwinStateService, digitalTwinService: DigitalTwinService, customerService: CustomerService);
    getTwinState(user: any): Promise<{
        success: boolean;
        data: import("../services/twin-state.service").TwinState;
    }>;
    generateDigitalTwin(user: any): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
            twin_id: string;
        };
    }>;
    uploadAvatar(user: any, file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
    }): Promise<{
        success: boolean;
        data: {
            avatar_url: string;
            message: string;
        };
    }>;
    getAlignmentIndex(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").AlignmentIndex;
    }>;
    getConsciousnessState(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").ConsciousnessState;
    }>;
    getCurrentPhase(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").CurrentPhase;
    }>;
    getEmotionalBaseline(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").EmotionalBaseline;
    }>;
    getEnergyLevel(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").EnergyLevel;
    }>;
    getKarmaState(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").KarmaState;
    }>;
    getManifestationResonance(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").ManifestationResonance;
    }>;
    getRecentActions(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").RecentActionInfluence;
    }>;
    getReflection(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").ReflectionPrompt;
    }>;
    getTwinEvolution(user: any): Promise<{
        success: boolean;
        data: import("../services/digital-twin.service").TwinEvolution;
    }>;
    getCompleteSummary(user: any): Promise<{
        success: boolean;
        data: {
            alignment_index: import("../services/digital-twin.service").AlignmentIndex;
            consciousness_state: import("../services/digital-twin.service").ConsciousnessState;
            current_phase: import("../services/digital-twin.service").CurrentPhase;
            emotional_baseline: import("../services/digital-twin.service").EmotionalBaseline;
            energy_level: import("../services/digital-twin.service").EnergyLevel;
            karma_state: import("../services/digital-twin.service").KarmaState;
            manifestation_resonance: import("../services/digital-twin.service").ManifestationResonance;
            recent_actions: import("../services/digital-twin.service").RecentActionInfluence;
            reflection: import("../services/digital-twin.service").ReflectionPrompt;
            evolution: import("../services/digital-twin.service").TwinEvolution;
        };
    }>;
}
