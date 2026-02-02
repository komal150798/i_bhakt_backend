import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TwinStateService } from '../services/twin-state.service';
import { DigitalTwinService } from '../services/digital-twin.service';
import { CustomerService } from '../../users/services/customer.service';
import { UpdateCustomerProfileDto } from '../../users/dtos/update-customer-profile.dto';

@ApiTags('app-twin')
@Controller('app/twin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppTwinController {
  constructor(
    private readonly twinStateService: TwinStateService,
    private readonly digitalTwinService: DigitalTwinService,
    private readonly customerService: CustomerService,
  ) {}

  // Legacy endpoint - keep for backward compatibility
  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current digital twin state (Legacy)' })
  @ApiResponse({ status: 200, description: 'Twin state retrieved successfully' })
  async getTwinState(@CurrentUser() user: any) {
    const state = await this.twinStateService.getTwinState(user.id);
    return {
      success: true,
      data: state,
    };
  }

  // Screen 08: Generate Digital Twin after profile completion
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Digital Twin after profile completion' })
  @ApiResponse({ status: 200, description: 'Digital Twin generated successfully' })
  async generateDigitalTwin(@CurrentUser() user: any) {
    const result = await this.digitalTwinService.generateDigitalTwin(user.id);
    return {
      success: true,
      data: result,
    };
  }

  // Screen 09: Upload Avatar Image for Digital Twin
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar image for Digital Twin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    },
  ) {
    // Save file and update customer avatar_img
    // For now, we'll use a URL - in production, upload to S3/cloud storage
    const avatarUrl = file ? `/uploads/avatars/${file.filename}` : null;
    
    if (avatarUrl) {
      await this.customerService.updateProfile(user.id, {
        avatar_img: avatarUrl,
      });
    }

    return {
      success: true,
      data: {
        avatar_url: avatarUrl,
        message: 'Avatar uploaded successfully. This image helps personalize your Digital Twin and is not shared publicly.',
      },
    };
  }

  // Screen 01: Alignment Index
  @Get('alignment-index')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Alignment Index (Screen 01)' })
  @ApiResponse({ status: 200, description: 'Alignment index retrieved successfully' })
  async getAlignmentIndex(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getAlignmentIndex(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 02: Consciousness State
  @Get('consciousness-state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Consciousness State (Screen 02)' })
  @ApiResponse({ status: 200, description: 'Consciousness state retrieved successfully' })
  async getConsciousnessState(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getConsciousnessState(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 03: Current Phase
  @Get('current-phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Current Phase (Screen 03)' })
  @ApiResponse({ status: 200, description: 'Current phase retrieved successfully' })
  async getCurrentPhase(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getCurrentPhase(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 04: Emotional Baseline
  @Get('emotional-baseline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Emotional Baseline (Screen 04)' })
  @ApiResponse({ status: 200, description: 'Emotional baseline retrieved successfully' })
  async getEmotionalBaseline(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getEmotionalBaseline(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 05: Energy Level
  @Get('energy-level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Energy Level (Screen 05)' })
  @ApiResponse({ status: 200, description: 'Energy level retrieved successfully' })
  async getEnergyLevel(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getEnergyLevel(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 06: Karma State
  @Get('karma-state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Karma State (Screen 06)' })
  @ApiResponse({ status: 200, description: 'Karma state retrieved successfully' })
  async getKarmaState(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getKarmaState(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 07: Manifestation Resonance
  @Get('manifestation-resonance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Manifestation Resonance (Screen 07)' })
  @ApiResponse({ status: 200, description: 'Manifestation resonance retrieved successfully' })
  async getManifestationResonance(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getManifestationResonance(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 08: Recent Action Influence
  @Get('recent-actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Recent Action Influence (Screen 08)' })
  @ApiResponse({ status: 200, description: 'Recent actions retrieved successfully' })
  async getRecentActions(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getRecentActionInfluence(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 09: Today's Reflection
  @Get('reflection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Today\'s Reflection Prompt (Screen 09)' })
  @ApiResponse({ status: 200, description: 'Reflection prompt retrieved successfully' })
  async getReflection(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getReflectionPrompt(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 10: Twin Evolution
  @Get('evolution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Twin Evolution (Screen 10)' })
  @ApiResponse({ status: 200, description: 'Twin evolution retrieved successfully' })
  async getTwinEvolution(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getTwinEvolution(user.id);
    return {
      success: true,
      data,
    };
  }

  // Screen 10: Complete Digital Twin Summary
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Complete Digital Twin Summary (All Screens)' })
  @ApiResponse({ status: 200, description: 'Complete twin summary retrieved successfully' })
  async getCompleteSummary(@CurrentUser() user: any) {
    const data = await this.digitalTwinService.getCompleteTwinSummary(user.id);
    return {
      success: true,
      data,
    };
  }
}

