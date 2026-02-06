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
exports.RecordKarmaDto = exports.KarmaTypeInput = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var KarmaTypeInput;
(function (KarmaTypeInput) {
    KarmaTypeInput["GOOD"] = "good";
    KarmaTypeInput["NEUTRAL"] = "neutral";
    KarmaTypeInput["CHALLENGING"] = "challenging";
})(KarmaTypeInput || (exports.KarmaTypeInput = KarmaTypeInput = {}));
class RecordKarmaDto {
}
exports.RecordKarmaDto = RecordKarmaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: KarmaTypeInput,
        example: 'good',
        description: 'Type of karma action: good, neutral, or challenging',
    }),
    (0, class_validator_1.IsEnum)(KarmaTypeInput),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordKarmaDto.prototype, "karma_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Helped a colleague with a difficult project without being asked.',
        description: 'Description of the karma action performed',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordKarmaDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Genuine support',
        description: 'Optional intention behind the action',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordKarmaDto.prototype, "intention", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Compassion and satisfaction',
        description: 'Optional emotional context of the action',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordKarmaDto.prototype, "emotional_context", void 0);
//# sourceMappingURL=record-karma.dto.js.map