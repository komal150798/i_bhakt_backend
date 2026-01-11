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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sms_template_entity_1 = require("../entities/sms-template.entity");
const email_template_entity_1 = require("../entities/email-template.entity");
let TemplateService = class TemplateService {
    constructor(smsTemplateRepository, emailTemplateRepository) {
        this.smsTemplateRepository = smsTemplateRepository;
        this.emailTemplateRepository = emailTemplateRepository;
    }
    render(templateString, vars) {
        if (!templateString) {
            return '';
        }
        let rendered = templateString;
        Object.keys(vars).forEach((key) => {
            const value = vars[key] !== null && vars[key] !== undefined
                ? String(vars[key])
                : '';
            const regex = new RegExp(`{{\\s*${this.escapeRegex(key)}\\s*}}`, 'g');
            rendered = rendered.replace(regex, value);
        });
        const remainingPlaceholders = rendered.match(/{{[^}]+}}/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            console.warn(`Template has unreplaced placeholders: ${remainingPlaceholders.join(', ')}`);
        }
        return rendered;
    }
    async getSmsTemplate(templateCode) {
        const template = await this.smsTemplateRepository.findOne({
            where: {
                template_code: templateCode,
                is_active: true,
                is_deleted: false,
            },
        });
        if (!template) {
            throw new common_1.NotFoundException(`SMS template not found: ${templateCode}`);
        }
        return template;
    }
    async getEmailTemplate(templateCode) {
        const template = await this.emailTemplateRepository.findOne({
            where: {
                template_code: templateCode,
                is_active: true,
                is_deleted: false,
            },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Email template not found: ${templateCode}`);
        }
        return template;
    }
    async renderSmsTemplate(templateCode, vars) {
        const template = await this.getSmsTemplate(templateCode);
        return this.render(template.body, vars);
    }
    async renderEmailTemplate(templateCode, vars) {
        const template = await this.getEmailTemplate(templateCode);
        return {
            subject: this.render(template.subject, vars),
            body: this.render(template.body, vars),
            is_html: template.is_html,
        };
    }
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sms_template_entity_1.SmsTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(email_template_entity_1.EmailTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TemplateService);
//# sourceMappingURL=template.service.js.map