import { EmotionalIntensity, MkaDimension } from '../../common/enums';
import { MkaFrequency, MkaPriority, MkaSourceType } from '../enums/mka.enum';
export interface MkaPracticeTemplate {
    key: string;
    dimension: MkaDimension;
    title: string;
    description: string;
    purpose: string;
    frequency: MkaFrequency;
    durationMinutes: number | null;
    priority: MkaPriority;
    sourceType: MkaSourceType;
    karmaEligible: boolean;
}
export declare const MIND_PRACTICES: Readonly<Record<EmotionalIntensity, MkaPracticeTemplate>>;
export declare const NEUTRAL_KARMA_PRACTICES: readonly MkaPracticeTemplate[];
export declare const FALLBACK_ACTION: MkaPracticeTemplate;
