import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { PlanResponseDto } from '../../plans/dtos/plan-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('App')
@Controller('app')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly plansService: PlansService) {}

  // ========== APP USER PLANS ==========

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans (App user)' })
  @ApiResponse({ status: 200, description: 'List of enabled plans', type: [PlanResponseDto] })
  async getPlans(): Promise<PlanResponseDto[]> {
    return this.plansService.findAll({ is_enabled: true });
  }

  @Get('plans/:uniqueId')
  @ApiOperation({ summary: 'Get plan details (App user)' })
  @ApiResponse({ status: 200, description: 'Plan details', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlan(@Param('uniqueId') uniqueId: string): Promise<PlanResponseDto> {
    return this.plansService.findOneByUniqueId(uniqueId);
  }

  // TODO: Add more app-specific endpoints for:
  // - App login (POST /app/auth/login) - handled in auth module
  // - My kundli (GET /app/kundli)
  // - Create/Update kundli (POST /app/kundli, PUT /app/kundli/:id)
  // - My subscription (GET /app/subscription)
  // - Buy plan / Create subscription (POST /app/subscriptions)
  // - App-specific notifications (GET /app/notifications)
}

