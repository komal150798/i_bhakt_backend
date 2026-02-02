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
exports.UpdateCustomerProfileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateCustomerProfileDto {
}
exports.UpdateCustomerProfileDto = UpdateCustomerProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Full name (will be split into first_name and last_name - first word becomes first_name, rest becomes last_name)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'First name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date of birth (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "date_of_birth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Time of birth (HH:MM:SS)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "time_of_birth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Place of birth' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "place_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude of birth place', minimum: -90, maximum: 90 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], UpdateCustomerProfileDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude of birth place', minimum: -180, maximum: 180 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], UpdateCustomerProfileDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timezone (e.g., Asia/Kolkata)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Gender' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Avatar URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "avatar_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Avatar image (alternative to avatar_url)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "avatar_img", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Life role' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "life_role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Relationship status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCustomerProfileDto.prototype, "relationship_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Interests (array of strings)', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateCustomerProfileDto.prototype, "interests", void 0);
//# sourceMappingURL=update-customer-profile.dto.js.map