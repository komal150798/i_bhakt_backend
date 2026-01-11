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
exports.GenerateKundliPdfDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class LagnaDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LagnaDto.prototype, "sign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LagnaDto.prototype, "degrees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LagnaDto.prototype, "lord", void 0);
class NakshatraDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NakshatraDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NakshatraDto.prototype, "pada", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NakshatraDto.prototype, "lord", void 0);
class PlanetDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanetDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanetDto.prototype, "sign", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanetDto.prototype, "sign_lord", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PlanetDto.prototype, "house", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanetDto.prototype, "nakshatra", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlanetDto.prototype, "nakshatra_lord", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PlanetDto.prototype, "nakshatra_pada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PlanetDto.prototype, "is_retrograde", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PlanetDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PlanetDto.prototype, "latitude", void 0);
class HouseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "house_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HouseDto.prototype, "sign", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HouseDto.prototype, "sign_lord", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "start_degree", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "end_degree", void 0);
class MahadashaDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "end", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MahadashaDto.prototype, "duration_years", void 0);
class DetailedTimelineEntryDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetailedTimelineEntryDto.prototype, "mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetailedTimelineEntryDto.prototype, "antardasha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetailedTimelineEntryDto.prototype, "pratyantar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetailedTimelineEntryDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DetailedTimelineEntryDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DetailedTimelineEntryDto.prototype, "duration_years", void 0);
class VimshottariDashaDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [MahadashaDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MahadashaDto),
    __metadata("design:type", Array)
], VimshottariDashaDto.prototype, "mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_antardasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_pratyantar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [DetailedTimelineEntryDto], description: 'Detailed Dasha timeline with Mahadasha, Antardasha, and Pratyantar' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DetailedTimelineEntryDto),
    __metadata("design:type", Array)
], VimshottariDashaDto.prototype, "detailed_timeline", void 0);
class DashaTimelineDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: VimshottariDashaDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => VimshottariDashaDto),
    __metadata("design:type", VimshottariDashaDto)
], DashaTimelineDto.prototype, "vimshottari", void 0);
class GenerateKundliPdfDto {
}
exports.GenerateKundliPdfDto = GenerateKundliPdfDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the person' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth date in YYYY-MM-DD format' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth time in HH:mm:ss format' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "birth_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth place' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "birth_place", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude of birth place' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateKundliPdfDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude of birth place' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateKundliPdfDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timezone of birth place' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: LagnaDto, description: 'Lagna (Ascendant) details' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LagnaDto),
    __metadata("design:type", LagnaDto)
], GenerateKundliPdfDto.prototype, "lagna", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: NakshatraDto, description: 'Nakshatra details' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NakshatraDto),
    __metadata("design:type", NakshatraDto)
], GenerateKundliPdfDto.prototype, "nakshatra", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [PlanetDto], description: 'Planetary positions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PlanetDto),
    __metadata("design:type", Array)
], GenerateKundliPdfDto.prototype, "planets", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [HouseDto], description: 'House details' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => HouseDto),
    __metadata("design:type", Array)
], GenerateKundliPdfDto.prototype, "houses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ayanamsa value' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateKundliPdfDto.prototype, "ayanamsa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tithi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "tithi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Yoga' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "yoga", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Karana' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateKundliPdfDto.prototype, "karana", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: DashaTimelineDto, description: 'Dasha timeline data' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DashaTimelineDto),
    __metadata("design:type", DashaTimelineDto)
], GenerateKundliPdfDto.prototype, "dasha_timeline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Full kundli data object (optional, used if individual fields not provided)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], GenerateKundliPdfDto.prototype, "full_data", void 0);
//# sourceMappingURL=generate-kundli-pdf.dto.js.map