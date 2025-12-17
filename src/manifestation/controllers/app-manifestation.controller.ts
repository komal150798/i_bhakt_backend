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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ManifestationService } from '../manifestation.service';
import { CreateManifestationDto } from '../dto/create-manifestation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Manifestation (App)')
@Controller('app/manifestations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppManifestationController {
  constructor(private readonly manifestationService: ManifestationService) {}

  /**
   * POST /api/v1/app/manifestations
   * Create a new manifestation
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new manifestation (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'Manifestation created successfully',
  })
  async createManifestation(
    @Body() dto: CreateManifestationDto,
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.createManifestation(
      user.id,
      dto,
    );

    return {
      success: true,
      data: {
        id: manifestation.id,
        title: manifestation.desire_text,
        clarity: Number(manifestation.linguistic_clarity),
        coherence: Number(manifestation.emotional_coherence),
        mfp_score: Number(manifestation.manifestation_probability),
        astro_index: Number(manifestation.astrological_resonance),
        best_manifestation_date: manifestation.best_manifestation_date,
        analysis_data: manifestation.analysis_data,
        created_at: manifestation.added_date,
      },
    };
  }

  /**
   * GET /api/v1/app/manifestations
   * Get all manifestations for the user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all manifestations (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Manifestations retrieved successfully',
  })
  async getManifestations(@CurrentUser() user: any) {
    const manifestations = await this.manifestationService.getUserManifestations(
      user.id,
    );

    return {
      success: true,
      data: manifestations.map((m) => ({
        id: m.id,
        title: m.desire_text,
        clarity: Number(m.linguistic_clarity),
        coherence: Number(m.emotional_coherence),
        mfp_score: Number(m.manifestation_probability),
        astro_index: Number(m.astrological_resonance),
        best_manifestation_date: m.best_manifestation_date,
        is_locked: m.metadata?.is_locked || false,
        created_at: m.added_date,
      })),
    };
  }

  /**
   * GET /api/v1/app/manifestations/:id
   * Get a single manifestation by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get manifestation by ID (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Manifestation not found' })
  async getManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.getManifestationById(
      user.id,
      id,
    );

    return {
      success: true,
      data: {
        id: manifestation.id,
        title: manifestation.desire_text,
        clarity: Number(manifestation.linguistic_clarity),
        coherence: Number(manifestation.emotional_coherence),
        mfp_score: Number(manifestation.manifestation_probability),
        astro_index: Number(manifestation.astrological_resonance),
        best_manifestation_date: manifestation.best_manifestation_date,
        analysis_data: manifestation.analysis_data,
        is_locked: manifestation.metadata?.is_locked || false,
        created_at: manifestation.added_date,
        updated_at: manifestation.modify_date,
      },
    };
  }

  /**
   * PUT /api/v1/app/manifestations/:id
   * Update a manifestation (e.g., lock it)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update manifestation (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation updated successfully',
  })
  async updateManifestation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { is_locked?: boolean; metadata?: Record<string, any> },
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.updateManifestation(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      data: {
        id: manifestation.id,
        is_locked: manifestation.metadata?.is_locked || false,
        updated_at: manifestation.modify_date,
      },
    };
  }

  /**
   * DELETE /api/v1/app/manifestations/:id
   * Delete a manifestation
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete manifestation (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation deleted successfully',
  })
  async deleteManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.manifestationService.deleteManifestation(user.id, id);

    return {
      success: true,
      message: 'Manifestation deleted successfully',
    };
  }
}

