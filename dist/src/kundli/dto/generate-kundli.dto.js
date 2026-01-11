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
exports.GenerateKundliDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GenerateKundliDto {
}
exports.GenerateKundliDto = GenerateKundliDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name of the person', example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date of birth (YYYY-MM-DD)', example: '1990-01-15' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Time of birth (HH:MM:SS)', example: '10:30:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'birth_time must be in HH:MM:SS format',
    }),
    __metadata("design:type", String)
], GenerateKundliDto.prototype, "birth_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Place of birth (city name)', example: 'Mumbai' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliDto.prototype, "birth_place", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude (optional, will be fetched if not provided)', example: 19.0760 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], GenerateKundliDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude (optional, will be fetched if not provided)', example: 72.8777 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], GenerateKundliDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timezone (optional, will be fetched if not provided)', example: 'Asia/Kolkata' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateKundliDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ayanamsa type (1=Lahiri, 2=Raman, 3=KP, 4=Sayana)', example: 1, default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], GenerateKundliDto.prototype, "ayanamsa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Override calculated dasha balance with exact value from reference (in years). Use this if your reference astrology software shows a different balance.',
        example: 9.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], GenerateKundliDto.prototype, "dasha_balance_years", void 0);
//# sourceMappingURL=generate-kundli.dto.js.map