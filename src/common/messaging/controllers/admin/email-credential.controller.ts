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
import { EmailCredential } from '../../entities/email-credential.entity';
import { CreateEmailCredentialDto } from '../../dto/create-email-credential.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';
import { CredentialService } from '../../services/credential.service';

@ApiTags('Admin - Email Credentials')
@Controller('admin/messaging/email-credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminEmailCredentialController {
  constructor(
    @InjectRepository(EmailCredential)
    private emailCredentialRepository: Repository<EmailCredential>,
    private credentialService: CredentialService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all Email credentials' })
  @ApiResponse({ status: 200, description: 'Email credentials retrieved' })
  async getAll() {
    const credentials = await this.emailCredentialRepository.find({
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
  @ApiOperation({ summary: 'Get Email credential by ID' })
  @ApiResponse({ status: 200, description: 'Email credential retrieved' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const credential = await this.emailCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'Email credential not found',
      };
    }

    return {
      success: true,
      data: credential,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Email credential' })
  @ApiResponse({ status: 201, description: 'Email credential created' })
  async create(@Body() dto: CreateEmailCredentialDto, @Request() req: any) {
    // If setting as active, deactivate others first
    if (dto.is_active) {
      await this.credentialService.deactivateAllEmailCredentials();
    }

    const credential = this.emailCredentialRepository.create({
      ...dto,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    });

    const saved = await this.emailCredentialRepository.save(credential);

    // If was set as active, activate it
    if (dto.is_active) {
      await this.credentialService.activateEmailCredential(saved.id);
    }

    return {
      success: true,
      data: saved,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Email credential' })
  @ApiResponse({ status: 200, description: 'Email credential updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEmailCredentialDto>,
    @Request() req: any,
  ) {
    const credential = await this.emailCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'Email credential not found',
      };
    }

    // If setting as active, deactivate others first
    if (dto.is_active && !credential.is_active) {
      await this.credentialService.deactivateAllEmailCredentials();
    }

    Object.assign(credential, dto);
    credential.updated_by = req.user?.id || null;

    const saved = await this.emailCredentialRepository.save(credential);

    // If was set as active, activate it
    if (dto.is_active) {
      await this.credentialService.activateEmailCredential(saved.id);
    }

    return {
      success: true,
      data: saved,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Email credential (soft delete)' })
  @ApiResponse({ status: 200, description: 'Email credential deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    const credential = await this.emailCredentialRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!credential) {
      return {
        success: false,
        message: 'Email credential not found',
      };
    }

    credential.is_deleted = true;
    await this.emailCredentialRepository.save(credential);

    return {
      success: true,
      message: 'Email credential deleted',
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate Email credential' })
  @ApiResponse({ status: 200, description: 'Email credential activated' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    await this.credentialService.activateEmailCredential(id);

    return {
      success: true,
      message: 'Email credential activated',
    };
  }
}

