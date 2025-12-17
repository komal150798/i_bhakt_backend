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
import { SmsTemplate } from '../../entities/sms-template.entity';
import { CreateSmsTemplateDto } from '../../dto/create-sms-template.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';

@ApiTags('Admin - SMS Templates')
@Controller('admin/messaging/sms-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminSmsTemplateController {
  constructor(
    @InjectRepository(SmsTemplate)
    private smsTemplateRepository: Repository<SmsTemplate>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all SMS templates' })
  @ApiResponse({ status: 200, description: 'SMS templates retrieved' })
  async getAll() {
    const templates = await this.smsTemplateRepository.find({
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
  @ApiOperation({ summary: 'Get SMS template by ID' })
  @ApiResponse({ status: 200, description: 'SMS template retrieved' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const template = await this.smsTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
      };
    }

    return {
      success: true,
      data: template,
    };
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get SMS template by code' })
  @ApiResponse({ status: 200, description: 'SMS template retrieved' })
  async getByCode(@Param('code') code: string) {
    const template = await this.smsTemplateRepository.findOne({
      where: { template_code: code, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
      };
    }

    return {
      success: true,
      data: template,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create SMS template' })
  @ApiResponse({ status: 201, description: 'SMS template created' })
  async create(@Body() dto: CreateSmsTemplateDto, @Request() req: any) {
    // Check if template_code already exists
    const existing = await this.smsTemplateRepository.findOne({
      where: { template_code: dto.template_code, is_deleted: false },
    });

    if (existing) {
      return {
        success: false,
        message: 'Template code already exists',
      };
    }

    const template = this.smsTemplateRepository.create({
      ...dto,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    const saved = await this.smsTemplateRepository.save(template);

    return {
      success: true,
      data: saved,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update SMS template' })
  @ApiResponse({ status: 200, description: 'SMS template updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSmsTemplateDto>,
    @Request() req: any,
  ) {
    const template = await this.smsTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
      };
    }

    // Check template_code uniqueness if being changed
    if (dto.template_code && dto.template_code !== template.template_code) {
      const existing = await this.smsTemplateRepository.findOne({
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

    const saved = await this.smsTemplateRepository.save(template);

    return {
      success: true,
      data: saved,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete SMS template (soft delete)' })
  @ApiResponse({ status: 200, description: 'SMS template deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    const template = await this.smsTemplateRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      return {
        success: false,
        message: 'SMS template not found',
      };
    }

    template.is_deleted = true;
    await this.smsTemplateRepository.save(template);

    return {
      success: true,
      message: 'SMS template deleted',
    };
  }
}



