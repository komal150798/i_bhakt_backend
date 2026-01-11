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
exports.KundliResponseDto = exports.HouseDto = exports.PlanetPositionDto = exports.DashaTimelineDto = exports.VimshottariDashaDto = exports.DetailedDashaPeriodDto = exports.MahadashaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MahadashaDto {
}
exports.MahadashaDto = MahadashaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MahadashaDto.prototype, "end", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MahadashaDto.prototype, "duration_years", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MahadashaDto.prototype, "duration_days", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], MahadashaDto.prototype, "is_balance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], MahadashaDto.prototype, "is_shadow_planet", void 0);
class DetailedDashaPeriodDto {
}
exports.DetailedDashaPeriodDto = DetailedDashaPeriodDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DetailedDashaPeriodDto.prototype, "mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DetailedDashaPeriodDto.prototype, "antardasha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DetailedDashaPeriodDto.prototype, "pratyantar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DetailedDashaPeriodDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DetailedDashaPeriodDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DetailedDashaPeriodDto.prototype, "duration_years", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DetailedDashaPeriodDto.prototype, "duration_days", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], DetailedDashaPeriodDto.prototype, "is_shadow_planet", void 0);
class VimshottariDashaDto {
}
exports.VimshottariDashaDto = VimshottariDashaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth Dasha Lord (determined from Moon Nakshatra)' }),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "birth_dasha_lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Balance years remaining in birth Mahadasha' }),
    __metadata("design:type", Number)
], VimshottariDashaDto.prototype, "balance_years", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Balance days remaining in birth Mahadasha' }),
    __metadata("design:type", Number)
], VimshottariDashaDto.prototype, "balance_days", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [MahadashaDto] }),
    __metadata("design:type", Array)
], VimshottariDashaDto.prototype, "mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_mahadasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_antardasha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], VimshottariDashaDto.prototype, "current_pratyantar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [DetailedDashaPeriodDto], description: 'Full detailed timeline with Mahadasha, Antardasha, and Pratyantar' }),
    __metadata("design:type", Array)
], VimshottariDashaDto.prototype, "detailed_timeline", void 0);
class DashaTimelineDto {
}
exports.DashaTimelineDto = DashaTimelineDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: VimshottariDashaDto }),
    __metadata("design:type", VimshottariDashaDto)
], DashaTimelineDto.prototype, "vimshottari", void 0);
class PlanetPositionDto {
}
exports.PlanetPositionDto = PlanetPositionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanetPositionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlanetPositionDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlanetPositionDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanetPositionDto.prototype, "sign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanetPositionDto.prototype, "sign_lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanetPositionDto.prototype, "nakshatra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PlanetPositionDto.prototype, "nakshatra_lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlanetPositionDto.prototype, "nakshatra_pada", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PlanetPositionDto.prototype, "house", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PlanetPositionDto.prototype, "is_retrograde", void 0);
class HouseDto {
}
exports.HouseDto = HouseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "house_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseDto.prototype, "sign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseDto.prototype, "sign_lord", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "start_degree", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HouseDto.prototype, "end_degree", void 0);
class KundliResponseDto {
}
exports.KundliResponseDto = KundliResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "birth_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "birth_place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KundliResponseDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KundliResponseDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], KundliResponseDto.prototype, "lagna", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], KundliResponseDto.prototype, "nakshatra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], KundliResponseDto.prototype, "planets", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], KundliResponseDto.prototype, "houses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], KundliResponseDto.prototype, "ayanamsa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "tithi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "yoga", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], KundliResponseDto.prototype, "karana", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: DashaTimelineDto, description: 'Vimshottari Dasha timeline with current periods' }),
    __metadata("design:type", DashaTimelineDto)
], KundliResponseDto.prototype, "dasha_timeline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], KundliResponseDto.prototype, "full_data", void 0);
//# sourceMappingURL=kundli-response.dto.js.map