import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlansService } from '../../plans/services/plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';

/**
 * Web SPA subscription catalog (same data as app; separate route prefix for web clients).
 */
@ApiTags('subscription')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebSubscriptionController {
  constructor(private readonly plansService: PlansService) {}

  @Get('plans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subscription plans (Web)' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
  })
  async getPlans(@CurrentUser() _user: CurrentUserPayload) {
    const plans = await this.plansService.findAll({ is_enabled: true });

    return {
      success: true,
      data: plans.map((plan) => ({
        id: plan.id,
        unique_id: plan.unique_id,
        plan_type: plan.plan_type,
        name: plan.name,
        description: plan.description,
        tagline: plan.tagline,
        monthly_price: plan.monthly_price,
        yearly_price: plan.yearly_price,
        currency: plan.currency,
        billing_cycle_days: plan.billing_cycle_days,
        referral_count_required: plan.referral_count_required,
        sort_order: plan.sort_order,
        features: plan.features || [],
        is_popular: plan.is_popular || false,
        usage_limits: plan.usage_limits,
        metadata: plan.metadata,
      })),
    };
  }
}
