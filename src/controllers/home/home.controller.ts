import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { CustomerService } from '../../users/services/customer.service';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(
    private readonly plansService: PlansService,
    private readonly customerService: CustomerService,
  ) {}

  // ========== PUBLIC PLANS ==========

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get all enabled plans (Public)' })
  @ApiResponse({ status: 200, description: 'List of enabled plans', type: [PlanResponseDto] })
  async getPlans(@Query('enabled') enabled?: string): Promise<PlanResponseDto[]> {
    const isEnabled = enabled === 'true' || enabled === undefined;
    return this.plansService.findAll({ is_enabled: isEnabled });
  }

  @Get('plans/:uniqueId')
  @Public()
  @ApiOperation({ summary: 'Get plan details by unique ID (Public)' })
  @ApiResponse({ status: 200, description: 'Plan details', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('uniqueId') uniqueId: string): Promise<PlanResponseDto> {
    return this.plansService.findOneByUniqueId(uniqueId);
  }

  /**
   * Lets the SPA align payment / upgrade UX with the API process (NODE_ENV),
   * independent of Vite dev vs production build.
   */
  @Get('runtime-config')
  @Public()
  @ApiOperation({ summary: 'Public runtime config for SPA (NODE_ENV)' })
  @ApiResponse({ status: 200, description: 'Runtime flags' })
  getRuntimeConfig() {
    const nodeEnv = (process.env.NODE_ENV || 'development').trim();
    const lower = nodeEnv.toLowerCase();
    const isDevLike = lower === 'dev' || lower === 'development';
    return {
      node_env: nodeEnv,
      /** True when server treats environment as dev (matches payment bypass logic). */
      is_dev_like: isDevLike,
    };
  }

  @Get('refer/code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referral code and share link' })
  @ApiResponse({ status: 200, description: 'Referral code fetched successfully' })
  async getReferralCode(@CurrentUser() user: CurrentUserPayload) {
    const code = await this.customerService.getReferralCode(user.id);
    const baseUrl = (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || '').trim();
    const referral_link = `${baseUrl || 'https://app.ibhakt.com'}/signup?ref=${code}`;

    return {
      success: true,
      data: {
        code,
        referral_link,
      },
    };
  }

  @Get('refer/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referral stats' })
  @ApiResponse({ status: 200, description: 'Referral stats fetched successfully' })
  async getReferralStats(@CurrentUser() user: CurrentUserPayload) {
    const stats = await this.customerService.getReferralStats(user.id);
    return {
      success: true,
      data: {
        totalReferrals: stats.total_referrals,
        successfulReferrals: stats.successful_referrals,
        earnings: `${stats.total_earnings}`,
      },
    };
  }

  // TODO: Add more public endpoints for:
  // - CMS content (homepage, about, etc.)
  // - Public blog/articles
  // - Public testimonials
  // - Public features/benefits
}

