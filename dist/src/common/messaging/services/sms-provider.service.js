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
var SmsProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsProviderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const sms_credential_entity_1 = require("../entities/sms-credential.entity");
let SmsProviderService = SmsProviderService_1 = class SmsProviderService {
    constructor(smsCredentialRepository, httpService) {
        this.smsCredentialRepository = smsCredentialRepository;
        this.httpService = httpService;
        this.logger = new common_1.Logger(SmsProviderService_1.name);
    }
    async getActiveCredential() {
        const credential = await this.smsCredentialRepository.findOne({
            where: {
                is_active: true,
                is_deleted: false,
            },
        });
        if (!credential) {
            throw new common_1.NotFoundException('No active SMS credential found. Please configure one in admin panel.');
        }
        return credential;
    }
    async sendSms(to, message) {
        const credential = await this.getActiveCredential();
        try {
            switch (credential.provider_name.toUpperCase()) {
                case 'TWILIO':
                    return await this.sendViaTwilio(credential, to, message);
                case 'MSG91':
                    return await this.sendViaMsg91(credential, to, message);
                case 'TEXTLOCAL':
                    return await this.sendViaTextLocal(credential, to, message);
                default:
                    throw new common_1.BadRequestException(`Unsupported SMS provider: ${credential.provider_name}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send SMS via ${credential.provider_name}:`, error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS',
            };
        }
    }
    async sendViaTwilio(credential, to, message) {
        const baseUrl = credential.base_url || 'https://api.twilio.com/2010-04-01';
        const accountSid = credential.api_key;
        const authToken = credential.api_secret;
        if (!authToken) {
            throw new common_1.BadRequestException('Twilio requires api_secret (auth token)');
        }
        const from = credential.sender_id || credential.extra_config?.from_number;
        if (!from) {
            throw new common_1.BadRequestException('Twilio requires sender_id or from_number in extra_config');
        }
        const url = `${baseUrl}/Accounts/${accountSid}/Messages.json`;
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, new URLSearchParams({
                From: from,
                To: to,
                Body: message,
            }), {
                auth: {
                    username: accountSid,
                    password: authToken,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }));
            return {
                success: true,
                message_id: response.data.sid,
            };
        }
        catch (error) {
            throw new Error(`Twilio API error: ${error.response?.data?.message || error.message}`);
        }
    }
    async sendViaMsg91(credential, to, message) {
        const baseUrl = credential.base_url || 'https://api.msg91.com/api/v5/flow';
        const authKey = credential.api_key;
        const senderId = credential.sender_id || 'IBHAKT';
        const url = `${baseUrl}`;
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, {
                template_id: credential.extra_config?.template_id,
                sender: senderId,
                short_url: '0',
                mobiles: to,
                ...credential.extra_config,
            }, {
                headers: {
                    'authkey': authKey,
                    'Content-Type': 'application/json',
                },
            }));
            return {
                success: true,
                message_id: response.data.request_id || response.data.message,
            };
        }
        catch (error) {
            throw new Error(`MSG91 API error: ${error.response?.data?.message || error.message}`);
        }
    }
    async sendViaTextLocal(credential, to, message) {
        const baseUrl = credential.base_url || 'https://api.textlocal.in/send';
        const apiKey = credential.api_key;
        const sender = credential.sender_id || 'TXTLCL';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(baseUrl, {
                apikey: apiKey,
                numbers: to,
                message: message,
                sender: sender,
            }));
            return {
                success: response.data.status === 'success',
                message_id: response.data.batch_id,
            };
        }
        catch (error) {
            throw new Error(`TextLocal API error: ${error.response?.data?.message || error.message}`);
        }
    }
};
exports.SmsProviderService = SmsProviderService;
exports.SmsProviderService = SmsProviderService = SmsProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sms_credential_entity_1.SmsCredential)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], SmsProviderService);
//# sourceMappingURL=sms-provider.service.js.map