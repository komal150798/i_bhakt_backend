"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const sms_credential_entity_1 = require("./entities/sms-credential.entity");
const email_credential_entity_1 = require("./entities/email-credential.entity");
const sms_template_entity_1 = require("./entities/sms-template.entity");
const email_template_entity_1 = require("./entities/email-template.entity");
const template_service_1 = require("./services/template.service");
const sms_provider_service_1 = require("./services/sms-provider.service");
const email_provider_service_1 = require("./services/email-provider.service");
const messaging_service_1 = require("./services/messaging.service");
const credential_service_1 = require("./services/credential.service");
const sms_credential_controller_1 = require("./controllers/admin/sms-credential.controller");
const email_credential_controller_1 = require("./controllers/admin/email-credential.controller");
const sms_template_controller_1 = require("./controllers/admin/sms-template.controller");
const email_template_controller_1 = require("./controllers/admin/email-template.controller");
let MessagingModule = class MessagingModule {
};
exports.MessagingModule = MessagingModule;
exports.MessagingModule = MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sms_credential_entity_1.SmsCredential,
                email_credential_entity_1.EmailCredential,
                sms_template_entity_1.SmsTemplate,
                email_template_entity_1.EmailTemplate,
            ]),
            axios_1.HttpModule,
        ],
        controllers: [
            sms_credential_controller_1.AdminSmsCredentialController,
            email_credential_controller_1.AdminEmailCredentialController,
            sms_template_controller_1.AdminSmsTemplateController,
            email_template_controller_1.AdminEmailTemplateController,
        ],
        providers: [
            template_service_1.TemplateService,
            sms_provider_service_1.SmsProviderService,
            email_provider_service_1.EmailProviderService,
            messaging_service_1.MessagingService,
            credential_service_1.CredentialService,
        ],
        exports: [
            messaging_service_1.MessagingService,
            template_service_1.TemplateService,
            sms_provider_service_1.SmsProviderService,
            email_provider_service_1.EmailProviderService,
        ],
    })
], MessagingModule);
//# sourceMappingURL=messaging.module.js.map