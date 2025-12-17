import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly plansService: PlansService) {}

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

  // TODO: Add more public endpoints for:
  // - CMS content (homepage, about, etc.)
  // - Public blog/articles
  // - Public testimonials
  // - Public features/benefits
}

