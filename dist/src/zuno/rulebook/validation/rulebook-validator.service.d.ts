import { ParsedWorkbook } from '../parsing/rulebook-parser.service';
import { ValidationFinding } from '../entities/zuno-rulebook-governance.entity';
export declare const RULEBOOK_VALIDATOR_VERSION = "rulebook-validator-1.0.0";
export interface ValidationResult {
    findings: ValidationFinding[];
    errorCount: number;
    warningCount: number;
    totalRules: number;
    validRules: number;
    invalidRules: number;
    duplicateCandidates: {
        key: string;
        duplicateOf: string;
    }[];
    passed: boolean;
}
export declare class RulebookValidatorService {
    private readonly logger;
    validate(workbook: ParsedWorkbook): ValidationResult;
}
