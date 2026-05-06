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
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { ManifestationEnhancedService } from '../services/manifestation-enhanced.service';
import { CreateManifestationEnhancedDto } from '../dtos/create-manifestation-enhanced.dto';
import {
  AddAlignmentActionsDto,
  CommitIntentionDto,
} from '../dtos/alignment-action.dto';
import { CalculateResonanceDto } from '../dtos/calculate-resonance.dto';
import {
  AddDailyProgressEntryDto,
  UpdateDailyProgressEntryDto,
} from '../dtos/daily-progress-entry.dto';
import { toNumber } from '../../common/utils/number.util';
import { EntitlementsService } from '../../subscriptions/services/entitlements.service';

@ApiTags('Manifestation (App)')
@Controller('app/manifestation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppManifestationController {
  constructor(
    private readonly manifestationService: ManifestationEnhancedService,
    private readonly entitlementsService: EntitlementsService,
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
  @ApiBody({
    type: CreateManifestationEnhancedDto,
    description: 'Manifestation description. Category, scores, and suggestions will be auto-generated based on your kundli.',
    examples: {
      career: {
        summary: 'Career manifestation example',
        value: {
          description: 'I want to become a successful teacher in 2028 and make a positive impact on students\' lives through quality education.',
        },
      },
      relationship: {
        summary: 'Relationship manifestation example',
        value: {
          description: 'I want to find my soulmate and build a loving, committed relationship based on mutual respect, understanding, and shared values.',
        },
      },
      money: {
        summary: 'Money manifestation example',
        value: {
          description: 'I want to achieve financial freedom by 2025 through smart investments and building multiple income streams.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Manifestation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (description too short, kundli missing, etc.)',
  })
  async createManifestation(
    @Body() dto: CreateManifestationEnhancedDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const manifestation = await this.manifestationService.createManifestation(
      user.id,
      dto,
    );

    // Use common utility function for number conversion

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
        resonance_score: toNumber(manifestation.resonance_score),
        alignment_score: toNumber(manifestation.alignment_score),
        antrashaakti_score: toNumber(manifestation.antrashaakti_score),
        mahaadha_score: toNumber(manifestation.mahaadha_score),
        astro_support_index: toNumber(manifestation.astro_support_index),
        mfp_score: toNumber(manifestation.mfp_score),
        coherence_score: toNumber(manifestation.coherence_score),
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
  async getDashboard(@CurrentUser() user: CurrentUserPayload) {
    if (!user.id) {
      throw new BadRequestException('User ID is missing');
    }
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
  async getAllManifestations(@CurrentUser() user: CurrentUserPayload) {
    if (!user.id) {
      throw new BadRequestException('User ID is missing');
    }
    const manifestations = await this.manifestationService.getAllManifestations(
      user.id,
      true,
    );

    // Use common utility function for number conversion

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
        resonance_score: toNumber(m.resonance_score),
        alignment_score: toNumber(m.alignment_score),
        antrashaakti_score: toNumber(m.antrashaakti_score),
        mahaadha_score: toNumber(m.mahaadha_score),
        astro_support_index: toNumber(m.astro_support_index),
        mfp_score: toNumber(m.mfp_score),
        coherence_score: toNumber(m.coherence_score),
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
  @ApiBody({
    type: CalculateResonanceDto,
    description: 'Manifestation description for resonance calculation',
    examples: {
      example1: {
        summary: 'Career manifestation',
        value: {
          description: 'I want to become a successful teacher in 2028 and make a positive impact on students\' lives.',
        },
      },
      example2: {
        summary: 'Relationship manifestation',
        value: {
          description: 'I want to find my soulmate and build a loving, committed relationship based on mutual respect and understanding.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resonance score calculated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Description too short (minimum 15 characters)',
  })
  async calculateResonance(
    @Body() dto: CalculateResonanceDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!dto.description || dto.description.trim().length < 15) {
      throw new BadRequestException(
        'Description must be at least 15 characters long.',
      );
    }

    const result = await this.manifestationService.calculateDetailedResonance(
      user.id,
      dto.description.trim(),
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
  @ApiBody({
    type: AddAlignmentActionsDto,
    description: 'Selected alignment actions to add to karma ledger',
    examples: {
      example1: {
        summary: 'Add multiple actions',
        value: {
          manifestation_id: 123,
          action_ids: [1, 2, 3],
        },
      },
    },
  })
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
    @CurrentUser() user: CurrentUserPayload,
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
  @ApiBody({
    type: CommitIntentionDto,
    description: 'Commitment data for manifestation',
    examples: {
      example1: {
        summary: 'Commit with message and target date',
        value: {
          manifestation_id: 123,
          commitment_message: 'I am fully committed to achieving this goal',
          target_date: '2025-12-31',
        },
      },
      example2: {
        summary: 'Simple commit',
        value: {
          manifestation_id: 123,
        },
      },
    },
  })
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
    @CurrentUser() user: CurrentUserPayload,
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

  /**
   * POST /api/v1/app/manifestation/daily-progress/add
   * Add daily progress entry for a manifestation
   */
  @Post('daily-progress/add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add daily progress entry for a manifestation' })
  async addDailyProgressEntry(
    @Body() dto: AddDailyProgressEntryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const entry = await this.manifestationService.addDailyProgressEntry(
      dto.manifestation_id,
      user.id,
      dto.entry_date,
      dto.action_text,
    );

    return {
      success: true,
      code: 201,
      message: 'Daily progress entry added.',
      data: {
        id: entry.id,
        manifestation_id: entry.manifestation_id,
        entry_date: entry.entry_date,
        action_text: entry.action_text,
      },
    };
  }

  /**
   * GET /api/v1/app/manifestation/:id/daily-progress
   * Get daily progress entries for a manifestation
   */
  @Get(':id/daily-progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get daily progress entries for a manifestation' })
  async getDailyProgressEntries(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const entries = await this.manifestationService.getDailyProgressEntries(id, user.id);

    return {
      success: true,
      code: 200,
      message: 'Daily progress entries retrieved.',
      data: entries.map((entry) => ({
        id: entry.id,
        manifestation_id: entry.manifestation_id,
        entry_date: entry.entry_date,
        action_text: entry.action_text,
        added_date: entry.added_date,
      })),
    };
  }

  /**
   * PUT /api/v1/app/manifestation/daily-progress/:entryId
   * Update daily progress entry
   */
  @Put('daily-progress/:entryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update daily progress entry' })
  async updateDailyProgressEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() dto: UpdateDailyProgressEntryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const entry = await this.manifestationService.updateDailyProgressEntry(
      entryId,
      user.id,
      dto.action_text || '',
    );

    return {
      success: true,
      code: 200,
      message: 'Daily progress entry updated.',
      data: {
        id: entry.id,
        manifestation_id: entry.manifestation_id,
        entry_date: entry.entry_date,
        action_text: entry.action_text,
      },
    };
  }

  /**
   * DELETE /api/v1/app/manifestation/daily-progress/:entryId
   * Delete daily progress entry
   */
  @Delete('daily-progress/:entryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete daily progress entry' })
  async deleteDailyProgressEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.manifestationService.deleteDailyProgressEntry(entryId, user.id);

    return {
      success: true,
      code: 200,
      message: 'Daily progress entry deleted.',
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
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const manifestation = await this.manifestationService.getManifestationById(
      id,
      user.id,
    );
    const dailyProgressEntries =
      await this.manifestationService.getDailyProgressEntries(id, user.id);
    const entitlements = await this.entitlementsService.getUserEntitlements(user.id);

    // Use common utility function for number conversion

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
        resonance_score: toNumber(manifestation.resonance_score),
        alignment_score: toNumber(manifestation.alignment_score),
        antrashaakti_score: toNumber(manifestation.antrashaakti_score),
        mahaadha_score: toNumber(manifestation.mahaadha_score),
        astro_support_index: toNumber(manifestation.astro_support_index),
        mfp_score: toNumber(manifestation.mfp_score),
        coherence_score: toNumber(manifestation.coherence_score),
        tips: manifestation.tips,
        insights: manifestation.insights,
        summary_for_ui: manifestation.insights?.summary_for_ui || null,
        action_windows: manifestation.action_windows ?? null,
        progress_tracking: manifestation.progress_tracking ?? null,
        /** Same enum string as dashboard (e.g. karma_pro) so the client can gate UI without relying on parent state */
        plan_type: entitlements.plan_type,
        daily_progress_entries: dailyProgressEntries.map((entry) => ({
          id: entry.id,
          manifestation_id: entry.manifestation_id,
          entry_date: entry.entry_date,
          action_text: entry.action_text,
          added_date: entry.added_date,
        })),
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
    @CurrentUser() user: CurrentUserPayload,
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
