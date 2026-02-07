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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("node:crypto");
const customer_entity_1 = require("../../users/entities/customer.entity");
const string_util_1 = require("../../common/utils/string.util");
let OtpService = OtpService_1 = class OtpService {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
        this.logger = new common_1.Logger(OtpService_1.name);
        this.OTP_EXPIRY_SECONDS = 5 * 60;
        this.MAX_ATTEMPTS = 5;
        this.RESEND_COOLDOWN_SECONDS = 60;
        this.OTP_LENGTH = 6;
    }
    generateOtp(length = this.OTP_LENGTH) {
        const max = Math.pow(10, length);
        const randomNumber = crypto.randomInt(0, max);
        return randomNumber.toString().padStart(length, '0');
    }
    async findCustomerByIdentifier(identifier) {
        if (identifier.includes('@')) {
            return this.customerRepository.findOne({
                where: { email: identifier.trim().toLowerCase(), is_deleted: false },
            });
        }
        const normalizedPhone = (0, string_util_1.normalizePhoneNumber)(identifier);
        const digitsOnly = normalizedPhone.replaceAll(/\D+/g, '');
        const variations = new Set();
        variations.add(normalizedPhone.trim());
        variations.add(`+${normalizedPhone.trim()}`);
        variations.add(digitsOnly);
        if (digitsOnly.length > 10) {
            variations.add(digitsOnly.slice(-10));
        }
        variations.add(identifier.trim());
        for (const variation of variations) {
            if (!variation)
                continue;
            const customer = await this.customerRepository.findOne({
                where: { phone_number: variation, is_deleted: false },
            });
            if (customer)
                return customer;
        }
        return null;
    }
    async issueOtp(identifier, purpose = 'login') {
        const customer = await this.findCustomerByIdentifier(identifier);
        if (!customer) {
            this.logger.warn(`OTP requested for non-existent user: ${identifier}`);
            throw new common_1.NotFoundException('User not found. Please register first.');
        }
        const otpCode = this.generateOtp();
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_SECONDS * 1000);
        customer.otp_code = otpCode;
        customer.otp_expires_at = expiresAt;
        customer.otp_attempts = 0;
        customer.otp_max_attempts = this.MAX_ATTEMPTS;
        customer.otp_purpose = purpose;
        customer.otp_verified_at = null;
        await this.customerRepository.save(customer);
        this.logger.log(`OTP issued for ${identifier} (purpose: ${purpose})`);
        return {
            otp_code: otpCode,
            expires_at: expiresAt,
            purpose,
            remaining_attempts: this.MAX_ATTEMPTS,
        };
    }
    async verifyOtp(identifier, otpCode) {
        const customer = await this.findCustomerByIdentifier(identifier);
        if (!customer) {
            this.logger.warn(`No customer found for OTP verification: ${identifier}`);
            return false;
        }
        if (!customer.otp_code) {
            this.logger.warn(`No OTP issued for ${identifier}`);
            return false;
        }
        if (!customer.otp_expires_at || customer.otp_expires_at < new Date()) {
            customer.otp_code = null;
            customer.otp_expires_at = null;
            customer.otp_purpose = null;
            await this.customerRepository.save(customer);
            this.logger.warn(`OTP expired for ${identifier}`);
            return false;
        }
        if (customer.otp_attempts >= customer.otp_max_attempts) {
            customer.otp_code = null;
            customer.otp_expires_at = null;
            customer.otp_purpose = null;
            await this.customerRepository.save(customer);
            this.logger.warn(`Max OTP attempts reached for ${identifier}`);
            return false;
        }
        customer.otp_attempts += 1;
        if (customer.otp_code !== otpCode) {
            await this.customerRepository.save(customer);
            this.logger.warn(`Invalid OTP attempt for ${identifier} (attempt ${customer.otp_attempts}/${customer.otp_max_attempts})`);
            return false;
        }
        customer.otp_verified_at = new Date();
        customer.otp_code = null;
        customer.otp_expires_at = null;
        customer.otp_purpose = null;
        customer.otp_attempts = 0;
        await this.customerRepository.save(customer);
        this.logger.log(`OTP verified successfully for ${identifier}`);
        return true;
    }
    async getResendCooldown(identifier) {
        const customer = await this.findCustomerByIdentifier(identifier);
        if (!customer?.otp_expires_at)
            return 0;
        const issuedAt = new Date(customer.otp_expires_at.getTime() - this.OTP_EXPIRY_SECONDS * 1000);
        const elapsed = (Date.now() - issuedAt.getTime()) / 1000;
        const remaining = this.RESEND_COOLDOWN_SECONDS - elapsed;
        return remaining > 0 ? Math.ceil(remaining) : 0;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OtpService);
//# sourceMappingURL=otp.service.js.map