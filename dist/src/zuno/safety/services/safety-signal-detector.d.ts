import { SafetyFlag } from '../../common/enums';
export declare class SafetySignalDetector {
    private readonly patterns;
    detect(text: string): SafetyFlag[];
}
