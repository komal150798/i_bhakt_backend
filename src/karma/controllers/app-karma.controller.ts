import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KarmaService, AddKarmaActionDto } from '../services/karma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Karma (App)')
@Controller('app/karma')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppKarmaController {
  constructor(private readonly karmaService: KarmaService) {}

  /**
   * GET /api/v1/app/karma/today
   * Get today's karma summary and input prompt
   */
  @Get('today')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get today's karma summary (Mobile App)" })
  @ApiResponse({
    status: 200,
    description: "Today's karma data retrieved successfully",
  })
  async getTodayKarma(@CurrentUser() user: any) {
    const userId = user.id;
    
    // Get today's karma entries and summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get dashboard summary which includes today's data
    const dashboard = await this.karmaService.getDashboardSummary(userId);
    
    // Get today's entries from recent actions
    const todayEntries = dashboard.recent_actions?.filter((entry: any) => {
      const entryDate = new Date(entry.entry_date);
      return entryDate >= today && entryDate < tomorrow;
    }) || [];

    return {
      success: true,
      data: {
        karma_score: dashboard.overall?.score || 0,
        today_input_submitted: todayEntries.length > 0,
        today_input_prompt: todayEntries.length === 0 
          ? "How did you align with your values today?" 
          : null,
        streak: 0, // TODO: Calculate streak from entries
        weekly_heatmap: [], // TODO: Generate weekly heatmap
        daily_alignment_tip: null, // TODO: Get from daily alignment tip service
      },
    };
  }

  /**
   * POST /api/v1/app/karma/input
   * Add a karma action/input
   */
  @Post('input')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add karma input/action (Mobile App)' })
  @ApiResponse({
    status: 201,
    description: 'Karma input added successfully',
  })
  async addKarmaInput(
    @Body() body: { action_text: string; timestamp?: string },
    @CurrentUser() user: any,
  ) {
    const dto: AddKarmaActionDto = {
      user_id: user.id,
      action_text: body.action_text,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    };

    const entry = await this.karmaService.addKarmaAction(dto);

    return {
      success: true,
      data: {
        id: entry.id,
        action_text: entry.text,
        karma_type: entry.karma_type,
        score: entry.score,
        category: entry.category_name,
        created_at: entry.added_date,
      },
    };
  }

  /**
   * GET /api/v1/app/karma/scores
   * Get karma scores (current, weekly, monthly)
   */
  @Get('scores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma scores (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Karma scores retrieved successfully',
  })
  async getKarmaScores(@CurrentUser() user: any) {
    const userId = user.id;
    const summary = await this.karmaService.getUserKarmaSummary(userId);

    // Get weekly and monthly insights for scores
    const weeklyInsights = await this.karmaService.getWeeklyInsights(userId);
    const monthlyInsights = await this.karmaService.getMonthlyInsights(userId);

    return {
      success: true,
      data: {
        current_score: summary.karma_score?.karma_score || 0,
        weekly_score: weeklyInsights.karma_score || 0,
        monthly_score: monthlyInsights.karma_score || 0,
        trend: summary.karma_score?.trend || 'stable',
        grade: this.getKarmaGrade(summary.karma_score?.karma_score || 0),
      },
    };
  }

  /**
   * GET /api/v1/app/karma/dashboard
   * Get comprehensive karma dashboard
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma dashboard (Mobile App)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboard(@CurrentUser() user: any) {
    const userId = user.id;
    const dashboard = await this.karmaService.getDashboardSummary(userId);

    return {
      success: true,
      data: {
        karma_score: dashboard.overall?.score || 0,
        karma_grade: dashboard.overall?.grade || 'Fair',
        trend: dashboard.overall?.trend || 'flat',
        total_actions: dashboard.overall?.total_actions || 0,
        recent_actions: dashboard.recent_actions?.slice(0, 10) || [],
        patterns: dashboard.patterns || [],
        improvement_plan: dashboard.improvement_plan || {},
        weekly_trend: dashboard.trends?.weekly || {},
        monthly_trend: dashboard.trends?.monthly || {},
        streak: dashboard.streak || {
          current_days: 0,
          longest_days: 0,
          level: 'awaken',
          level_name: 'Awaken',
          next_level_threshold: 7,
          progress_to_next_level: 0,
        },
      },
    };
  }

  /**
   * Helper method to get karma grade
   */
  private getKarmaGrade(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Needs Improvement';
    return 'Poor';
  }
}

