import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../../entities/email-template.entity';
import { CreateEmailTemplateDto } from '../../dto/create-email-template.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';

@ApiTags('Admin - Email Templates')
@Controller('admin/messaging/email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminEmailTemplateController {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all Email templates' })
  @ApiResponse({ status: 200, description: 'Email templates retrieved' })
  async getAll() {
    const templates = await this.emailTemplateRepository.find({
      where: { is_deleted: false },
      order: { template_code: 'ASC' },
    });

    return {
      success: true,
      data: templates,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Email template by ID' })
  @ApiResponse({ status: 200, description: 'Email template retrieved' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const template = await this.emailTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
      };
    }

    return {
      success: true,
      data: template,
    };
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Email template by code' })
  @ApiResponse({ status: 200, description: 'Email template retrieved' })
  async getByCode(@Param('code') code: string) {
    const template = await this.emailTemplateRepository.findOne({
      where: { template_code: code, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
      };
    }

    return {
      success: true,
      data: template,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Email template' })
  @ApiResponse({ status: 201, description: 'Email template created' })
  async create(@Body() dto: CreateEmailTemplateDto, @Request() req: any) {
    // Check if template_code already exists
    const existing = await this.emailTemplateRepository.findOne({
      where: { template_code: dto.template_code, is_deleted: false },
    });

    if (existing) {
      return {
        success: false,
        message: 'Template code already exists',
      };
    }

    const template = this.emailTemplateRepository.create({
      ...dto,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    const saved = await this.emailTemplateRepository.save(template);

    return {
      success: true,
      data: saved,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Email template' })
  @ApiResponse({ status: 200, description: 'Email template updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEmailTemplateDto>,
    @Request() req: any,
  ) {
    const template = await this.emailTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
      };
    }

    // Check template_code uniqueness if being changed
    if (dto.template_code && dto.template_code !== template.template_code) {
      const existing = await this.emailTemplateRepository.findOne({
        where: { template_code: dto.template_code, is_deleted: false },
      });

      if (existing) {
        return {
          success: false,
          message: 'Template code already exists',
        };
      }
    }

    Object.assign(template, dto);
    template.updated_by = req.user?.id || null;

    const saved = await this.emailTemplateRepository.save(template);

    return {
      success: true,
      data: saved,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Email template (soft delete)' })
  @ApiResponse({ status: 200, description: 'Email template deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    const template = await this.emailTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'Email template not found',
      };
    }

    template.is_deleted = true;
    await this.emailTemplateRepository.save(template);

    return {
      success: true,
      message: 'Email template deleted',
    };
  }
}



