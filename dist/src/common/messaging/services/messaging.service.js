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
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const template_service_1 = require("./template.service");
const sms_provider_service_1 = require("./sms-provider.service");
const email_provider_service_1 = require("./email-provider.service");
let MessagingService = class MessagingService {
    constructor(templateService, smsProviderService, emailProviderService) {
        this.templateService = templateService;
        this.smsProviderService = smsProviderService;
        this.emailProviderService = emailProviderService;
    }
    async sendSmsWithTemplate(to, templateCode, variables) {
        const message = await this.templateService.renderSmsTemplate(templateCode, variables);
        return this.smsProviderService.sendSms(to, message);
    }
    async sendSms(to, message) {
        return this.smsProviderService.sendSms(to, message);
    }
    async sendEmailWithTemplate(to, templateCode, variables, options) {
        const rendered = await this.templateService.renderEmailTemplate(templateCode, variables);
        return this.emailProviderService.sendEmail({
            to,
            subject: rendered.subject,
            body: rendered.body,
            is_html: rendered.is_html,
            ...options,
        });
    }
    async sendEmail(options) {
        return this.emailProviderService.sendEmail(options);
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [template_service_1.TemplateService,
        sms_provider_service_1.SmsProviderService,
        email_provider_service_1.EmailProviderService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map