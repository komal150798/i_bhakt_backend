import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KarmaService, AddKarmaActionDto, KarmaSummaryDto } from '../../karma/services/karma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('karma')
@Controller('customer/karma')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KarmaController {
  constructor(private readonly karmaService: KarmaService) {}

  /**
   * POST /api/v1/customer/karma/add
   * Add a new karma action
   */
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  async addKarmaAction(@Body() dto: AddKarmaActionDto, @Request() req: any) {
    // Use authenticated user's ID
    dto.user_id = req.user.id;
    return this.karmaService.addKarmaAction(dto);
  }

  /**
   * POST /api/v1/customer/karma/user/summary
   * Get comprehensive karma summary
   */
  @Post('user/summary')
  @HttpCode(HttpStatus.OK)
  async getUserKarmaSummary(@Body() body: { user_id?: number }, @Request() req: any): Promise<KarmaSummaryDto> {
    // If user_id is provided in body, verify it matches authenticated user (unless admin)
    if (body.user_id !== undefined && body.user_id !== null) {
      const requestedUserId = Number(body.user_id);
      const authenticatedUserId = Number(req.user.id);
      if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('You can only access your own karma data');
      }
      return this.karmaService.getUserKarmaSummary(requestedUserId);
    }
    // If no user_id provided, use authenticated user's ID
    return this.karmaService.getUserKarmaSummary(Number(req.user.id));
  }

  /**
   * POST /api/v1/customer/karma/user/habits
   * Get personalized habit recommendations
   */
  @Post('user/habits')
  @HttpCode(HttpStatus.OK)
  async getUserHabits(@Body() body: { user_id?: number }, @Request() req: any) {
    if (body.user_id !== undefined && body.user_id !== null) {
      const requestedUserId = Number(body.user_id);
      const authenticatedUserId = Number(req.user.id);
      if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('You can only access your own karma data');
      }
      return this.karmaService.getUserHabits(requestedUserId);
    }
    return this.karmaService.getUserHabits(Number(req.user.id));
  }

  /**
   * POST /api/v1/customer/karma/user/patterns
   * Get karma pattern analysis
   */
  @Post('user/patterns')
  @HttpCode(HttpStatus.OK)
  async getUserPatterns(@Body() body: { user_id?: number }, @Request() req: any) {
    if (body.user_id !== undefined && body.user_id !== null) {
      const requestedUserId = Number(body.user_id);
      const authenticatedUserId = Number(req.user.id);
      if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('You can only access your own karma data');
      }
      return this.karmaService.getUserPatterns(requestedUserId);
    }
    return this.karmaService.getUserPatterns(Number(req.user.id));
  }

  /**
   * POST /api/v1/customer/karma/user/weekly
   * Get weekly karma insights
   */
  @Post('user/weekly')
  @HttpCode(HttpStatus.OK)
  async getWeeklyInsights(@Body() body: { user_id?: number }, @Request() req: any) {
    if (body.user_id !== undefined && body.user_id !== null) {
      const requestedUserId = Number(body.user_id);
      const authenticatedUserId = Number(req.user.id);
      if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('You can only access your own karma data');
      }
      return this.karmaService.getWeeklyInsights(requestedUserId);
    }
    return this.karmaService.getWeeklyInsights(Number(req.user.id));
  }

  /**
   * POST /api/v1/customer/karma/user/monthly
   * Get monthly karma insights
   */
  @Post('user/monthly')
  @HttpCode(HttpStatus.OK)
  async getMonthlyInsights(@Body() body: { user_id?: number }, @Request() req: any) {
    if (body.user_id !== undefined && body.user_id !== null) {
      const requestedUserId = Number(body.user_id);
      const authenticatedUserId = Number(req.user.id);
      if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('You can only access your own karma data');
      }
      return this.karmaService.getMonthlyInsights(requestedUserId);
    }
    return this.karmaService.getMonthlyInsights(Number(req.user.id));
  }

  /**
   * POST /api/v1/customer/karma/dashboard
   * Get comprehensive karma dashboard summary for authenticated user
   */
  @Post('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma dashboard summary for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
  })
  async getDashboard(@Request() req: any) {
    const userId = req.user.id;
    return this.karmaService.getDashboardSummary(userId);
  }
}

