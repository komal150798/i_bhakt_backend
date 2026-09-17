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
exports.BirthProfileView = exports.UpsertBirthProfileDto = exports.ProfileView = exports.UpdateProfileDto = exports.MeView = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
class MeView {
    static from(user, profile) {
        return {
            id: user.id,
            preferredName: profile?.preferred_name ?? null,
            locale: user.locale,
            timezone: user.timezone,
            onboardingStatus: user.onboarding_status,
        };
    }
}
exports.MeView = MeView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MeView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MeView.prototype, "preferredName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MeView.prototype, "locale", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], MeView.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.OnboardingStatus }),
    __metadata("design:type", String)
], MeView.prototype, "onboardingStatus", void 0);
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "preferredName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO 3166-1 alpha-2.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO code' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "countryCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "occupation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 16),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "preferredLanguage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IANA timezone, e.g. Asia/Dubai.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 64),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "timezone", void 0);
class ProfileView {
    static from(profile, user) {
        return {
            preferredName: profile?.preferred_name ?? null,
            displayName: profile?.display_name ?? null,
            countryCode: profile?.country_code ?? null,
            city: profile?.city ?? null,
            occupation: profile?.occupation ?? null,
            preferredLanguage: profile?.preferred_language ?? null,
            timezone: user.timezone,
        };
    }
}
exports.ProfileView = ProfileView;
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "preferredName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "countryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "occupation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "preferredLanguage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], ProfileView.prototype, "timezone", void 0);
class UpsertBirthProfileDto {
}
exports.UpsertBirthProfileDto = UpsertBirthProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1978-08-13', description: 'YYYY-MM-DD.' }),
    (0, class_validator_1.IsISO8601)({ strict: true }),
    __metadata("design:type", String)
], UpsertBirthProfileDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '07:05:00',
        description: 'Local clock time at the place of birth. Omit if unknown.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'timeOfBirth must be HH:mm or HH:mm:ss',
    }),
    __metadata("design:type", String)
], UpsertBirthProfileDto.prototype, "timeOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.BirthTimeAccuracy }),
    (0, class_validator_1.IsEnum)(enums_1.BirthTimeAccuracy),
    __metadata("design:type", String)
], UpsertBirthProfileDto.prototype, "timeAccuracy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dongargarh' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], UpsertBirthProfileDto.prototype, "placeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO 3166-1 alpha-2.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, { message: 'placeCountryCode must be a 2-letter ISO code' }),
    __metadata("design:type", String)
], UpsertBirthProfileDto.prototype, "placeCountryCode", void 0);
class BirthProfileView {
    static from(profile) {
        return {
            id: profile.id,
            dateOfBirth: profile.date_of_birth,
            timeOfBirth: profile.time_of_birth,
            timeAccuracy: profile.time_accuracy,
            placeName: profile.place_name,
            placeCountryCode: profile.place_country_code,
            placeResolved: profile.latitude !== null &&
                profile.longitude !== null &&
                profile.timezone_at_birth !== null,
            calculationReady: profile.isCalculationReady,
            version: profile.version,
        };
    }
}
exports.BirthProfileView = BirthProfileView;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BirthProfileView.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BirthProfileView.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], BirthProfileView.prototype, "timeOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.BirthTimeAccuracy }),
    __metadata("design:type", String)
], BirthProfileView.prototype, "timeAccuracy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BirthProfileView.prototype, "placeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], BirthProfileView.prototype, "placeCountryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True once a trusted source resolved the place.' }),
    __metadata("design:type", Boolean)
], BirthProfileView.prototype, "placeResolved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True when astrology has everything it needs.' }),
    __metadata("design:type", Boolean)
], BirthProfileView.prototype, "calculationReady", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BirthProfileView.prototype, "version", void 0);
//# sourceMappingURL=identity.dtos.js.map