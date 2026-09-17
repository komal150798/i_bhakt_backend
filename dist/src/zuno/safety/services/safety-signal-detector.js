"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetySignalDetector = void 0;
const common_1 = require("@nestjs/common");
const enums_1 = require("../../common/enums");
let SafetySignalDetector = class SafetySignalDetector {
    constructor() {
        this.patterns = [
            {
                flag: enums_1.SafetyFlag.SELF_HARM,
                expressions: [
                    /\b(kill|killing)\s+(myself|my\s?self)\b/,
                    /\bend(ing)?\s+(my|it)\s+(life|all)\b/,
                    /\b(want|going|plan(ning)?)\s+to\s+die\b/,
                    /\bsuicid(e|al)\b/,
                    /\b(hurt|harm|cut|cutting)\s+(myself|my\s?self)\b/,
                    /\bnot\s+(want|worth)\s+(to\s+)?(live|living|be\s+here)\b/,
                    /\bno\s+(reason|point)\s+(to\s+|in\s+)?(live|living|going\s+on)\b/,
                    /\bbetter\s+off\s+(dead|without\s+me)\b/,
                    /\bself[\s-]?harm\b/,
                    /\boverdos(e|ing)\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.HARM_TO_OTHERS,
                expressions: [
                    /\b(kill|hurt|harm|attack|stab|shoot)\s+(him|her|them|someone|somebody|my\s+\w+)\b/,
                    /\bmake\s+(him|her|them)\s+(pay|suffer)\b/,
                    /\bget\s+revenge\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.IMMEDIATE_MEDICAL_RISK,
                expressions: [
                    /\b(chest\s+pain|heart\s+attack|stroke)\b/,
                    /\bcan(no|')?t\s+breathe\b/,
                    /\b(bleeding|blood)\s+(heavily|a\s+lot|badly|won'?t\s+stop)\b/,
                    /\b(unconscious|passed\s+out|collapsed)\b/,
                    /\bemergency\s+room\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.ABUSE,
                expressions: [
                    /\b(he|she|they|husband|wife|partner|father|mother|boss)\s+(hits?|hit|beats?|beat|abus(es|ed))\s+me\b/,
                    /\b(domestic|physical|emotional|sexual)\s+abuse\b/,
                    /\bafraid\s+(of|for)\s+my\s+(life|safety)\b/,
                    /\bnot\s+safe\s+at\s+home\b/,
                    /\bthreaten(s|ed|ing)?\s+(to\s+)?(hurt|kill|harm)\s+me\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.CHILD_SAFETY,
                expressions: [
                    /\b(my\s+)?(child|kid|son|daughter|baby)\s+(is\s+)?(being\s+)?(hurt|abused|beaten|unsafe|in\s+danger)\b/,
                    /\bchild\s+(abuse|neglect)\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.VIOLENCE,
                expressions: [
                    /\b(being\s+)?(attacked|assaulted)\b/,
                    /\bthreat(s|ened|ening)?\s+(of\s+)?violence\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.CRIMINAL_REQUEST,
                expressions: [
                    /\bhow\s+(to|do\s+i)\s+(hide|launder)\s+(money|assets)\b/,
                    /\b(forge|fake|falsify)\s+(documents?|signature|papers?)\b/,
                    /\bevade\s+(tax|taxes|police|arrest)\b/,
                    /\bbribe\s+(an?\s+)?(official|officer|inspector)\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.SERIOUS_LEGAL_RISK,
                expressions: [
                    /\b(arrested|lawsuit|sued|court\s+case|legal\s+notice|criminal\s+charge)\b/,
                    /\bdeport(ed|ation)?\b/,
                    /\bvisa\s+(cancel(l)?ed|revoked|expired)\b/,
                    /\b(police|immigration)\s+(complaint|case)\b/,
                ],
            },
            {
                flag: enums_1.SafetyFlag.SEVERE_FINANCIAL_RISK,
                expressions: [
                    /\b(bankrupt|bankruptcy|insolven(t|cy))\b/,
                    /\b(foreclos(e|ure)|repossess(ed|ion)?)\b/,
                    /\bdefault(ed|ing)?\s+on\s+(my\s+)?(loan|mortgage|emi|payments?)\b/,
                    /\bcan(no|')?t\s+(pay|afford)\s+(my\s+)?(loan|mortgage|emi|rent|bills?)\b/,
                    /\b(debt\s+collector|recovery\s+agent)\b/,
                    /\blos(e|ing|t)\s+(my\s+)?(house|home)\b/,
                ],
            },
        ];
    }
    detect(text) {
        const normalised = normalise(text);
        if (!normalised)
            return [];
        const found = new Set();
        for (const { flag, expressions } of this.patterns) {
            if (expressions.some((expression) => expression.test(normalised))) {
                found.add(flag);
            }
        }
        return Array.from(found);
    }
};
exports.SafetySignalDetector = SafetySignalDetector;
exports.SafetySignalDetector = SafetySignalDetector = __decorate([
    (0, common_1.Injectable)()
], SafetySignalDetector);
function normalise(text) {
    return (text ?? '')
        .toLowerCase()
        .replace(/[‘’]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=safety-signal-detector.js.map