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
exports.CreateEmailTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateEmailTemplateDto {
}
exports.CreateEmailTemplateDto = CreateEmailTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WELCOME_EMAIL', description: 'Unique template code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "template_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Welcome Email', description: 'Template name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Welcome to iBhakt!', description: 'Email subject' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '<html><body><h1>Welcome {{name}}!</h1><p>Your account is ready.</p></body></html>',
        description: 'Email body (HTML or text) with {{variables}}'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Is body HTML format' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmailTemplateDto.prototype, "is_html", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEmailTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Is template active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmailTemplateDto.prototype, "is_active", void 0);
//# sourceMappingURL=create-email-template.dto.js.map