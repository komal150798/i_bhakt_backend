import { KarmaClassificationRequest, KarmaClassificationResult, KarmaClassifierPort } from '../ports/karma-classifier.port';
export declare const DETERMINISTIC_KARMA_CLASSIFIER_VERSION = "karma-deterministic-1.0";
export declare class DeterministicKarmaClassifier implements KarmaClassifierPort {
    classify(request: KarmaClassificationRequest): Promise<KarmaClassificationResult>;
}
