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
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const razorpay_1 = require("razorpay");
let RazorpayService = RazorpayService_1 = class RazorpayService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RazorpayService_1.name);
        this.client = null;
    }
    getKeyId() {
        return this.config.get('RAZORPAY_KEY_ID') || '';
    }
    isConfigured() {
        const keyId = this.config.get('RAZORPAY_KEY_ID');
        const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
        return Boolean(keyId && keySecret);
    }
    getClient() {
        if (!this.isConfigured()) {
            throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }
        if (!this.client) {
            this.client = new razorpay_1.default({
                key_id: this.config.get('RAZORPAY_KEY_ID'),
                key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
            });
        }
        return this.client;
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map