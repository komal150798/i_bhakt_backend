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
import { SmsCredential } from '../../entities/sms-credential.entity';
import { CreateSmsCredentialDto } from '../../dto/create-sms-credential.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';
import { CredentialService } from '../../services/credential.service';

@ApiTags('Admin - SMS Credentials')
@Controller('admin/messaging/sms-credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminSmsCredentialController {
  constructor(
    @InjectRepository(SmsCredential)
    private smsCredentialRepository: Repository<SmsCredential>,
    private credentialService: CredentialService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all SMS credentials' })
  @ApiResponse({ status: 200, description: 'SMS credentials retrieved' })
  async getAll() {
    const credentials = await this.smsCredentialRepository.find({
      where: { is_deleted: false },
      order: { is_active: 'DESC', added_date: 'DESC' },
    });

    return {
      success: true,
      data: credentials,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get SMS credential by ID' })
  @ApiResponse({ status: 200, description: 'SMS credential retrieved' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const credential = await this.smsCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'SMS credential not found',
      };
    }

    return {
      success: true,
      data: credential,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create SMS credential' })
  @ApiResponse({ status: 201, description: 'SMS credential created' })
  async create(@Body() dto: CreateSmsCredentialDto, @Request() req: any) {
    // If setting as active, deactivate others first
    if (dto.is_active) {
      await this.credentialService.deactivateAllSmsCredentials();
    }

    const credential = this.smsCredentialRepository.create({
      ...dto,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    const saved = await this.smsCredentialRepository.save(credential);

    // If was set as active, activate it
    if (dto.is_active) {
      await this.credentialService.activateSmsCredential(saved.id);
    }

    return {
      success: true,
      data: saved,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update SMS credential' })
  @ApiResponse({ status: 200, description: 'SMS credential updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSmsCredentialDto>,
    @Request() req: any,
  ) {
    const credential = await this.smsCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'SMS credential not found',
      };
    }

    // If setting as active, deactivate others first
    if (dto.is_active && !credential.is_active) {
      await this.credentialService.deactivateAllSmsCredentials();
    }

    Object.assign(credential, dto);
    credential.updated_by = req.user?.id || null;

    const saved = await this.smsCredentialRepository.save(credential);

    // If was set as active, activate it
    if (dto.is_active) {
      await this.credentialService.activateSmsCredential(saved.id);
    }

    return {
      success: true,
      data: saved,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete SMS credential (soft delete)' })
  @ApiResponse({ status: 200, description: 'SMS credential deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    const credential = await this.smsCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'SMS credential not found',
      };
    }

    credential.is_deleted = true;
    await this.smsCredentialRepository.save(credential);

    return {
      success: true,
      message: 'SMS credential deleted',
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate SMS credential' })
  @ApiResponse({ status: 200, description: 'SMS credential activated' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    await this.credentialService.activateSmsCredential(id);

    return {
      success: true,
      message: 'SMS credential activated',
    };
  }
}

