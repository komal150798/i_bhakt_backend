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
exports.VerifyRazorpayPaymentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class VerifyRazorpayPaymentDto {
}
exports.VerifyRazorpayPaymentDto = VerifyRazorpayPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order_Rxxxxx' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpay_order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pay_Rxxxxx' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpay_payment_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Signature from Razorpay Checkout handler' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], VerifyRazorpayPaymentDto.prototype, "razorpay_signature", void 0);
//# sourceMappingURL=verify-razorpay-payment.dto.js.map