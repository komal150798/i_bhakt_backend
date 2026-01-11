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
exports.CreateSmsCredentialDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSmsCredentialDto {
}
exports.CreateSmsCredentialDto = CreateSmsCredentialDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TWILIO', description: 'SMS provider name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsCredentialDto.prototype, "provider_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ACxxxxxxxxxxxxx', description: 'API key' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsCredentialDto.prototype, "api_key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'your-auth-token', description: 'API secret/auth token' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsCredentialDto.prototype, "api_secret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+1234567890', description: 'Sender ID or phone number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsCredentialDto.prototype, "sender_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://api.twilio.com', description: 'Base URL for API' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsCredentialDto.prototype, "base_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional configuration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSmsCredentialDto.prototype, "extra_config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false, description: 'Set as active credential' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSmsCredentialDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-sms-credential.dto.js.map