import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsTemplate } from '../entities/sms-template.entity';
import { EmailTemplate } from '../entities/email-template.entity';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(SmsTemplate)
    private smsTemplateRepository: Repository<SmsTemplate>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  /**
   * Render template string with variable replacement
   * Supports {{variable}} syntax
   */
  render(templateString: string, vars: Record<string, any>): string {
    if (!templateString) {
      return '';
    }

    let rendered = templateString;

    // Replace all {{variable}} placeholders
    Object.keys(vars).forEach((key) => {
      const value = vars[key] !== null && vars[key] !== undefined 
        ? String(vars[key]) 
        : '';
      
      // Replace {{key}} and {{ key }} (with optional spaces)
      const regex = new RegExp(`{{\\s*${this.escapeRegex(key)}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // Warn about any remaining {{placeholders}}
    const remainingPlaceholders = rendered.match(/{{[^}]+}}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      console.warn(
        `Template has unreplaced placeholders: ${remainingPlaceholders.join(', ')}`,
      );
    }

    return rendered;
  }

  /**
   * Get SMS template by code
   */
  async getSmsTemplate(templateCode: string): Promise<SmsTemplate> {
    const template = await this.smsTemplateRepository.findOne({
      where: {
        template_code: templateCode,
        is_active: true,
        is_deleted: false,
      },
    });

    if (!template) {
      throw new NotFoundException(
        `SMS template not found: ${templateCode}`,
      );
    }

    return template;
  }

  /**
   * Get Email template by code
   */
  async getEmailTemplate(templateCode: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOne({
      where: {
        template_code: templateCode,
        is_active: true,
        is_deleted: false,
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Email template not found: ${templateCode}`,
      );
    }

    return template;
  }

  /**
   * Render SMS template with variables
   */
  async renderSmsTemplate(
    templateCode: string,
    vars: Record<string, any>,
  ): Promise<string> {
    const template = await this.getSmsTemplate(templateCode);
    return this.render(template.body, vars);
  }

  /**
   * Render Email template with variables
   */
  async renderEmailTemplate(
    templateCode: string,
    vars: Record<string, any>,
  ): Promise<{ subject: string; body: string; is_html: boolean }> {
    const template = await this.getEmailTemplate(templateCode);
    return {
      subject: this.render(template.subject, vars),
      body: this.render(template.body, vars),
      is_html: template.is_html,
    };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}



