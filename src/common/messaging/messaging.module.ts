import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SmsCredential } from './entities/sms-credential.entity';
import { EmailCredential } from './entities/email-credential.entity';
import { SmsTemplate } from './entities/sms-template.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { TemplateService } from './services/template.service';
import { SmsProviderService } from './services/sms-provider.service';
import { EmailProviderService } from './services/email-provider.service';
import { MessagingService } from './services/messaging.service';
import { CredentialService } from './services/credential.service';
import { AdminSmsCredentialController } from './controllers/admin/sms-credential.controller';
import { AdminEmailCredentialController } from './controllers/admin/email-credential.controller';
import { AdminSmsTemplateController } from './controllers/admin/sms-template.controller';
import { AdminEmailTemplateController } from './controllers/admin/email-template.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmsCredential,
      EmailCredential,
      SmsTemplate,
      EmailTemplate,
    ]),
    HttpModule,
  ],
  controllers: [
    AdminSmsCredentialController,
    AdminEmailCredentialController,
    AdminSmsTemplateController,
    AdminEmailTemplateController,
  ],
  providers: [
    TemplateService,
    SmsProviderService,
    EmailProviderService,
    MessagingService,
    CredentialService,
  ],
  exports: [
    MessagingService,
    TemplateService,
    SmsProviderService,
    EmailProviderService,
  ],
})
export class MessagingModule {}



