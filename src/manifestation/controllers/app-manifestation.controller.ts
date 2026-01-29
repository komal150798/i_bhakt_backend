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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ManifestationEnhancedService } from '../services/manifestation-enhanced.service';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import {
  AddAlignmentActionsDto,
  CommitIntentionDto,
} from '../dtos/alignment-action.dto';

@ApiTags('Manifestation (App)')
@Controller('app/manifestation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppManifestationController {
  constructor(
    private readonly manifestationService: ManifestationEnhancedService,
  ) {}

  // ============================================
  // STATIC ROUTES (must come before :id routes)
  // ============================================

  /**
   * POST /api/v1/app/manifestation/add
   * Create a new manifestation with AI scoring (Screen 1)
   */
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new manifestation with AI scoring' })
  @ApiResponse({
    status: 201,
    description: 'Manifestation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (description too short, etc.)',
  })
  async createManifestation(
    @Body() dto: CreateManifestationEnhancedDto,
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.createManifestation(
      user.id,
      dto,
    );

    // Return only essential data for fast response
    // Other details (tips, insights, etc.) can be fetched via /:id endpoint
    return {
      success: true,
      code: 201,
      message: 'Manifestation created.',
      data: {
        id: manifestation.id,
        unique_id: manifestation.unique_id,
        title: manifestation.title,
        category: manifestation.category,
        category_label: manifestation.insights?.category_label || null,
        resonance_score: manifestation.resonance_score,
        alignment_score: manifestation.alignment_score,
        antrashaakti_score: manifestation.antrashaakti_score,
        mahaadha_score: manifestation.mahaadha_score,
        astro_support_index: manifestation.astro_support_index,
        mfp_score: manifestation.mfp_score,
      },
    };
  }

  /**
   * GET /api/v1/app/manifestation/dashboard
   * Get dashboard data with summary and manifestations
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get manifestation dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboard(@CurrentUser() user: any) {
    const dashboard = await this.manifestationService.getDashboard(user.id);

    return {
      success: true,
      code: 200,
      message: 'Dashboard data retrieved.',
      data: dashboard,
    };
  }

  /**
   * GET /api/v1/app/manifestation/list/all
   * Get all manifestations (active and archived)
   */
  @Get('list/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all manifestations including archived' })
  @ApiResponse({
    status: 200,
    description: 'Manifestations retrieved successfully',
  })
  async getAllManifestations(@CurrentUser() user: any) {
    const manifestations = await this.manifestationService.getAllManifestations(
      user.id,
      true,
    );

    return {
      success: true,
      code: 200,
      message: 'Manifestations retrieved.',
      data: manifestations.map((m) => ({
        id: m.id,
        unique_id: m.unique_id,
        title: m.title,
        description: m.description,
        category: m.category,
        resonance_score: m.resonance_score,
        mfp_score: m.mfp_score,
        is_archived: m.is_archived,
        is_locked: m.is_locked,
        added_date: m.added_date,
      })),
    };
  }

  /**
   * POST /api/v1/app/manifestation/calculate-resonance
   * Calculate detailed resonance score with Dasha analysis
   */
  @Post('calculate-resonance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate detailed resonance score with Dasha analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Resonance score calculated successfully',
  })
  async calculateResonance(
    @Body() body: { description: string },
    @CurrentUser() user: any,
  ) {
    if (!body.description || body.description.trim().length < 15) {
      throw new BadRequestException(
        'Description must be at least 15 characters long.',
      );
    }

    const result = await this.manifestationService.calculateDetailedResonance(
      user.id,
      body.description.trim(),
    );

    return {
      success: true,
      code: 200,
      message: 'Resonance score calculated.',
      data: result,
    };
  }

  /**
   * POST /api/v1/app/manifestation/alignment-actions/add
   * Add selected alignment actions to karma ledger (Screen 3)
   */
  @Post('alignment-actions/add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add selected alignment actions to karma ledger' })
  @ApiResponse({
    status: 201,
    description: 'Alignment actions added to karma ledger successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async addAlignmentActionsToKarma(
    @Body() dto: AddAlignmentActionsDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.addAlignmentActionsToKarma(
      dto.manifestation_id,
      dto.action_ids,
      user.id,
    );

    return {
      success: true,
      code: 201,
      message: 'Alignment actions added to your karma ledger.',
      data: result,
    };
  }

  /**
   * POST /api/v1/app/manifestation/commit
   * Commit manifestation intention (Screen 4)
   */
  @Post('commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit manifestation intention' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation committed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async commitIntention(
    @Body() dto: CommitIntentionDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.commitIntention(
      dto.manifestation_id,
      user.id,
      dto.commitment_message,
      dto.target_date,
    );

    return {
      success: true,
      code: 200,
      message: 'You have consciously committed to your manifestation.',
      data: result,
    };
  }

  // ============================================
  // PARAMETERIZED ROUTES (must come after static routes)
  // ============================================

  /**
   * GET /api/v1/app/manifestation/:id
   * Get full manifestation details with insights
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get manifestation by ID with full details' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.getManifestationById(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Manifestation retrieved.',
      data: {
        id: manifestation.id,
        unique_id: manifestation.unique_id,
        title: manifestation.title,
        description: manifestation.description,
        category: manifestation.category,
        category_label: manifestation.insights?.category_label || null,
        emotional_state: manifestation.emotional_state,
        target_date: manifestation.target_date,
        resonance_score: manifestation.resonance_score,
        alignment_score: manifestation.alignment_score,
        antrashaakti_score: manifestation.antrashaakti_score,
        mahaadha_score: manifestation.mahaadha_score,
        astro_support_index: manifestation.astro_support_index,
        mfp_score: manifestation.mfp_score,
        tips: manifestation.tips,
        insights: manifestation.insights,
        summary_for_ui: manifestation.insights?.summary_for_ui || null,
        is_archived: manifestation.is_archived,
        is_locked: manifestation.is_locked,
        added_date: manifestation.added_date,
        modify_date: manifestation.modify_date,
      },
    };
  }

  /**
   * PUT /api/v1/app/manifestation/archive/:id
   * Archive a manifestation
   */
  @Put('archive/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation archived successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async archiveManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const manifestation = await this.manifestationService.archiveManifestation(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Manifestation archived.',
      data: {
        id: manifestation.id,
        is_archived: manifestation.is_archived,
      },
    };
  }

  /**
   * PUT /api/v1/app/manifestation/lock/:id
   * Lock/Unlock a manifestation (locked manifestations are used for dashboard calculations)
   */
  @Put('lock/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock or unlock a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation lock status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async toggleLockManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const manifestation =
      await this.manifestationService.toggleLockManifestation(id, user.id);

    return {
      success: true,
      code: 200,
      message: manifestation.is_locked
        ? 'Manifestation locked. It will now be included in dashboard calculations.'
        : 'Manifestation unlocked. It will no longer be included in dashboard calculations.',
      data: {
        id: manifestation.id,
        is_locked: manifestation.is_locked,
      },
    };
  }

  /**
   * GET /api/v1/app/manifestation/tips/:id
   * Get tips and rituals for a manifestation
   */
  @Get('tips/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tips and rituals for a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Tips retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getTips(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const tips = await this.manifestationService.getTips(id, user.id);

    return {
      success: true,
      code: 200,
      message: 'Tips retrieved.',
      data: tips,
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/resonance-score
   * Get resonance score breakdown for a manifestation (Screen 2)
   */
  @Get(':id/resonance-score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get resonance score breakdown for a manifestation',
  })
  @ApiResponse({
    status: 200,
    description: 'Resonance score breakdown retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getResonanceScoreBreakdown(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.getResonanceScoreBreakdown(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Resonance score breakdown retrieved.',
      data: result,
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/alignment-actions
   * Get alignment actions for a manifestation (Screen 3)
   */
  @Get(':id/alignment-actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get alignment actions for a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Alignment actions retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getAlignmentActions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.getAlignmentActions(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Alignment actions retrieved.',
      data: result,
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/cosmic-support
   * Get cosmic support index (Dasha periods) for a manifestation (Screen 5)
   */
  @Get(':id/cosmic-support')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cosmic support index (Dasha periods) for a manifestation',
  })
  @ApiResponse({
    status: 200,
    description: 'Cosmic support index retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getCosmicSupportIndex(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.getCosmicSupportIndex(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Cosmic support index retrieved.',
      data: result,
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/alignment-summary
   * Get alignment summary for a manifestation (Screen 6)
   */
  @Get(':id/alignment-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get alignment summary for a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Alignment summary retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getAlignmentSummary(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.getAlignmentSummary(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Alignment summary retrieved.',
      data: result,
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/journey-timeline
   * Get journey timeline for a manifestation (Screen 6)
   */
  @Get(':id/journey-timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get journey timeline for a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Journey timeline retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async getJourneyTimeline(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.manifestationService.getJourneyTimeline(
      id,
      user.id,
    );

    return {
      success: true,
      code: 200,
      message: 'Journey timeline retrieved.',
      data: result,
    };
  }

  /**
   * DELETE /api/v1/app/manifestation/:id
   * Soft delete a manifestation
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a manifestation' })
  @ApiResponse({
    status: 200,
    description: 'Manifestation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Manifestation not found',
  })
  async deleteManifestation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    // Archive instead of hard delete
    await this.manifestationService.archiveManifestation(id, user.id);

    return {
      success: true,
      code: 200,
      message: 'Manifestation deleted successfully.',
    };
  }
}
