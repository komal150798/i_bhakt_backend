"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManifestationEnhancedDto = exports.EmotionalState = exports.ManifestationCategory = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ManifestationCategory;
(function (ManifestationCategory) {
    ManifestationCategory["RELATIONSHIP"] = "relationship";
    ManifestationCategory["CAREER"] = "career";
    ManifestationCategory["MONEY"] = "money";
    ManifestationCategory["HEALTH"] = "health";
    ManifestationCategory["SPIRITUAL"] = "spiritual";
})(ManifestationCategory || (exports.ManifestationCategory = ManifestationCategory = {}));
var EmotionalState;
(function (EmotionalState) {
    EmotionalState["GRATEFUL"] = "grateful";
    EmotionalState["HOPEFUL"] = "hopeful";
    EmotionalState["CONFIDENT"] = "confident";
    EmotionalState["ANXIOUS"] = "anxious";
    EmotionalState["FRUSTRATED"] = "frustrated";
    EmotionalState["PEACEFUL"] = "peaceful";
    EmotionalState["EXCITED"] = "excited";
})(EmotionalState || (exports.EmotionalState = EmotionalState = {}));
class CreateManifestationEnhancedDto {
}
exports.CreateManifestationEnhancedDto = CreateManifestationEnhancedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Find my dream job in tech',
        description: 'Manifestation title (optional - will be auto-generated from description if not provided)',
        minLength: 3,
        maxLength: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'I want to find a fulfilling job that aligns with my values and allows me to grow professionally while making a positive impact.',
        description: 'Detailed description of the manifestation intent. Category and title will be auto-detected from this.',
        minLength: 15,
        maxLength: 2000,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(15),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ManifestationCategory,
        description: 'Category of manifestation',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ManifestationCategory),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: EmotionalState,
        description: 'Current emotional state',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EmotionalState),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "emotional_state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2024-12-31',
        description: 'Target date for manifestation (optional)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "target_date", void 0);
//# sourceMappingURL=create-manifestation-enhanced.dto.js.map