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
exports.UpdateAIPromptDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_ai_prompt_dto_1 = require("./create-ai-prompt.dto");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class UpdateAIPromptDto extends (0, swagger_1.PartialType)(create_ai_prompt_dto_1.CreateAIPromptDto) {
}
exports.UpdateAIPromptDto = UpdateAIPromptDto;
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Model hint (e.g., gpt-4.1, gemini-pro)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAIPromptDto.prototype, "model_hint", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Prompt type', enum: ['system', 'user', 'tool', 'instruction'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['system', 'user', 'tool', 'instruction']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAIPromptDto.prototype, "type", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Language code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAIPromptDto.prototype, "language", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Prompt template with {{variables}}' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAIPromptDto.prototype, "template", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Description for admin UI' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateAIPromptDto.prototype, "description", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ description: 'Is active' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateAIPromptDto.prototype, "is_active", void 0);
//# sourceMappingURL=update-ai-prompt.dto.js.map