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
exports.UpdateDailyProgressEntryDto = exports.AddDailyProgressEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AddDailyProgressEntryDto {
}
exports.AddDailyProgressEntryDto = AddDailyProgressEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Manifestation ID' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddDailyProgressEntryDto.prototype, "manifestation_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Entry date in YYYY-MM-DD format',
        example: '2026-04-28',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AddDailyProgressEntryDto.prototype, "entry_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'What user did today to complete manifestation',
        example: 'I meditated for 20 minutes and updated my action plan.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], AddDailyProgressEntryDto.prototype, "action_text", void 0);
class UpdateDailyProgressEntryDto {
}
exports.UpdateDailyProgressEntryDto = UpdateDailyProgressEntryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Updated action text',
        example: 'I meditated for 30 minutes and wrote gratitude journal.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateDailyProgressEntryDto.prototype, "action_text", void 0);
//# sourceMappingURL=daily-progress-entry.dto.js.map