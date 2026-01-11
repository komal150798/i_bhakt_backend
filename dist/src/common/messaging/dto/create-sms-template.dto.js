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
exports.CreateSmsTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSmsTemplateDto {
}
exports.CreateSmsTemplateDto = CreateSmsTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OTP_LOGIN_SMS', description: 'Unique template code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "template_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OTP Login SMS', description: 'Template name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Hi {{name}}, your OTP is {{otp}}. Valid for {{minutes}} minutes.',
        description: 'Template body with {{variables}}'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSmsTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Is template active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSmsTemplateDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-sms-template.dto.js.map