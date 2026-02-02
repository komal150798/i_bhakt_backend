import { Manifestation } from '../entities/manifestation.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
import { KundliPlanet } from '../../kundli/entities/kundli-planet.entity';
import { KundliHouse } from '../../kundli/entities/kundli-house.entity';
export interface ManifestationWeakness {
    uses_desire_language: boolean;
    authority_missing: boolean;
    time_dependency: boolean;
}
export interface KundliAlignmentProfile {
    sun_support: 'strong' | 'medium' | 'weak';
    saturn_support: 'strong' | 'medium' | 'weak';
    moon_stability: 'stable' | 'unstable';
    jupiter_guidance: boolean;
    rahu_support: 'strong' | 'medium' | 'weak';
}
export declare class ManifestationAlignmentService {
    private readonly logger;
    detectManifestationWeakness(text: string): ManifestationWeakness;
    evaluateKundliSupport(manifestation: Manifestation, kundli: Kundli, planets: KundliPlanet[], houses: KundliHouse[]): KundliAlignmentProfile;
    private determineGoalType;
    private evaluatePlanetStrength;
    rewriteManifestationText(originalText: string, kundliProfile: KundliAlignmentProfile): string;
    private addProcessWords;
    applySafeResponseUpdate(manifestation: Manifestation, rewrittenTitle: string, rewrittenDescription: string, kundliProfile: KundliAlignmentProfile, alignmentImprovement: number): Partial<Manifestation>;
    private generateKundliAlignedRitual;
    private generateKundliAlignedThought;
    private enhanceNarrative;
    private generateSummaryForUI;
    analyzeManifestationText(manifestation: Manifestation, kundli: Kundli | null, planets: KundliPlanet[], houses: KundliHouse[]): {
        shouldRewrite: boolean;
        rewrittenTitle?: string;
        rewrittenDescription?: string;
        alignmentImprovement: number;
        kundliProfile?: KundliAlignmentProfile;
    };
}
