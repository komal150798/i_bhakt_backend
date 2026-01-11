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
var EmailProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProviderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const email_credential_entity_1 = require("../entities/email-credential.entity");
let EmailProviderService = EmailProviderService_1 = class EmailProviderService {
    constructor(emailCredentialRepository, httpService) {
        this.emailCredentialRepository = emailCredentialRepository;
        this.httpService = httpService;
        this.logger = new common_1.Logger(EmailProviderService_1.name);
    }
    async getActiveCredential() {
        const credential = await this.emailCredentialRepository.findOne({
            where: {
                is_active: true,
                is_deleted: false,
            },
        });
        if (!credential) {
            throw new common_1.NotFoundException('No active Email credential found. Please configure one in admin panel.');
        }
        return credential;
    }
    async sendEmail(options) {
        const credential = await this.getActiveCredential();
        try {
            switch (credential.provider_name.toUpperCase()) {
                case 'MAILGUN':
                    return await this.sendViaMailgun(credential, options);
                case 'SENDGRID':
                    return await this.sendViaSendGrid(credential, options);
                case 'SES':
                    return await this.sendViaSES(credential, options);
                default:
                    throw new common_1.BadRequestException(`Unsupported Email provider: ${credential.provider_name}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send Email via ${credential.provider_name}:`, error);
            return {
                success: false,
                error: error.message || 'Failed to send Email',
            };
        }
    }
    async sendViaMailgun(credential, options) {
        const domain = credential.domain || credential.extra_config?.domain;
        if (!domain) {
            throw new common_1.BadRequestException('Mailgun requires domain');
        }
        const baseUrl = credential.base_url || `https://api.mailgun.net/v3/${domain}`;
        const apiKey = credential.api_key;
        const toArray = Array.isArray(options.to) ? options.to : [options.to];
        const formData = new URLSearchParams();
        formData.append('from', `${credential.from_name || 'iBhakt'} <${credential.from_email}>`);
        toArray.forEach(email => formData.append('to', email));
        formData.append('subject', options.subject);
        formData.append(options.is_html ? 'html' : 'text', options.body);
        if (options.cc) {
            const ccArray = Array.isArray(options.cc) ? options.cc : [options.cc];
            ccArray.forEach(email => formData.append('cc', email));
        }
        if (options.bcc) {
            const bccArray = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
            bccArray.forEach(email => formData.append('bcc', email));
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/messages`, formData, {
                auth: {
                    username: 'api',
                    password: apiKey,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }));
            return {
                success: true,
                message_id: response.data.id,
            };
        }
        catch (error) {
            throw new Error(`Mailgun API error: ${error.response?.data?.message || error.message}`);
        }
    }
    async sendViaSendGrid(credential, options) {
        const baseUrl = credential.base_url || 'https://api.sendgrid.com/v3';
        const apiKey = credential.api_key;
        const toArray = Array.isArray(options.to) ? options.to : [options.to];
        const personalizations = [
            {
                to: toArray.map(email => ({ email })),
                ...(options.cc && {
                    cc: (Array.isArray(options.cc) ? options.cc : [options.cc]).map(email => ({ email })),
                }),
                ...(options.bcc && {
                    bcc: (Array.isArray(options.bcc) ? options.bcc : [options.bcc]).map(email => ({ email })),
                }),
            },
        ];
        const payload = {
            personalizations,
            from: {
                email: credential.from_email,
                name: credential.from_name || 'iBhakt',
            },
            subject: options.subject,
            content: [
                {
                    type: options.is_html ? 'text/html' : 'text/plain',
                    value: options.body,
                },
            ],
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${baseUrl}/mail/send`, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }));
            return {
                success: true,
                message_id: response.headers['x-message-id'] || 'sent',
            };
        }
        catch (error) {
            throw new Error(`SendGrid API error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        }
    }
    async sendViaSES(credential, options) {
        this.logger.warn('AWS SES integration requires AWS SDK. Please install @aws-sdk/client-ses');
        throw new common_1.BadRequestException('AWS SES integration not yet implemented. Please use Mailgun or SendGrid.');
    }
};
exports.EmailProviderService = EmailProviderService;
exports.EmailProviderService = EmailProviderService = EmailProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_credential_entity_1.EmailCredential)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], EmailProviderService);
//# sourceMappingURL=email-provider.service.js.map