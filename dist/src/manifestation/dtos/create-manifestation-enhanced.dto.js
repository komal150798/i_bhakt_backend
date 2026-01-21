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
exports.CreateManifestationEnhancedDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateManifestationEnhancedDto {
}
exports.CreateManifestationEnhancedDto = CreateManifestationEnhancedDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'I want to find a fulfilling job that aligns with my values and allows me to grow professionally while making a positive impact.',
        description: 'Manifestation intention text. Title, category, emotional state and all scores will be auto-detected from this text based on your kundli.',
        minLength: 15,
        maxLength: 2000,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(15),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateManifestationEnhancedDto.prototype, "description", void 0);
//# sourceMappingURL=create-manifestation-enhanced.dto.js.map