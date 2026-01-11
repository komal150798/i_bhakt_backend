"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
let OtpService = class OtpService {
    constructor() {
        this.OTP_EXPIRY_SECONDS = 5 * 60;
        this.otpCache = new Map();
    }
    cleanExpired() {
        const now = Date.now() / 1000;
        const expiredKeys = [];
        this.otpCache.forEach((entry, key) => {
            if (entry.expiry < now) {
                expiredKeys.push(key);
            }
        });
        expiredKeys.forEach((key) => this.otpCache.delete(key));
    }
    generateOtp(phoneNumber, length = 6) {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    }
    issueOtp(phoneNumber) {
        this.cleanExpired();
        const code = this.generateOtp(phoneNumber);
        const expiry = Date.now() / 1000 + this.OTP_EXPIRY_SECONDS;
        this.otpCache.set(phoneNumber, { code, expiry });
        return code;
    }
    verifyOtp(phoneNumber, otpCode) {
        this.cleanExpired();
        const entry = this.otpCache.get(phoneNumber);
        if (!entry) {
            return false;
        }
        if (entry.expiry < Date.now() / 1000) {
            this.otpCache.delete(phoneNumber);
            return false;
        }
        if (entry.code !== otpCode) {
            return false;
        }
        this.otpCache.delete(phoneNumber);
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)()
], OtpService);
//# sourceMappingURL=otp.service.js.map