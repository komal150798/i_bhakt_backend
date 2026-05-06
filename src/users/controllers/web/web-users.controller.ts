import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { formatFullName } from '../../../common/utils/string.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { PlansService } from '../../../plans/services/plans.service';
import { KundliService } from '../../../kundli/services/kundli.service';
import { UpgradePlanDto } from '../../dtos/upgrade-plan.dto';

@ApiTags('users')
@Controller('users')
export class WebUsersController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly plansService: PlansService,
    private readonly kundliService: KundliService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (Web)' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
    const fullUser = await this.customerService.findByUniqueId(user.unique_id);
    
    return {
      success: true,
      data: {
        unique_id: fullUser.unique_id,
        first_name: fullUser.first_name,
        last_name: fullUser.last_name,
        email: fullUser.email,
        phone_number: fullUser.phone_number,
        date_of_birth: fullUser.date_of_birth,
        time_of_birth: fullUser.time_of_birth,
        place_name: fullUser.place_name,
        gender: fullUser.gender,
        current_plan: fullUser.current_plan,
        referral_code: fullUser.referral_code,
        is_verified: fullUser.is_verified,
        avatar_url: fullUser.avatar_url,
      },
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile (Web)' })
  @ApiBody({
    type: UpdateCustomerProfileDto,
    description: 'Profile update data. All fields are optional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: UpdateCustomerProfileDto,
  ) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
    const fullUser = await this.customerService.findByUniqueId(user.unique_id);
    
    // Update Customer
    const updated = await this.customerService.updateProfile(user.id, updateData);
    
    return {
      success: true,
      data: {
        unique_id: updated.unique_id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        message: 'Profile updated successfully',
      },
    };
  }

  @Get('me/current-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription plan (Web)' })
  async getCurrentPlan(@CurrentUser() user: CurrentUserPayload) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
    const planType = await this.subscriptionsService.getCurrentPlanType(user.id);

    return {
      success: true,
      data: {
        plan_type: planType,
        subscription: subscription
          ? {
              unique_id: subscription.unique_id,
              plan_type: subscription.plan_type,
              start_date: subscription.start_date,
              end_date: subscription.end_date,
              is_active: subscription.is_active,
            }
          : null,
      },
    };
  }

  @Get('me/allowed-modules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all modules user has access to (Web)' })
  async getAllowedModules(@CurrentUser() user: CurrentUserPayload) {
    const modules = await this.subscriptionsService.getUserModules(user.id);

    return {
      success: true,
      data: {
        modules,
      },
    };
  }

  @Get('me/usage-limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage and limits for all modules (Web)' })
  async getUsageLimits(@CurrentUser() user: CurrentUserPayload) {
    const limits = await this.usageTrackingService.getUserUsageLimits(user.id);

    return {
      success: true,
      data: limits,
    };
  }

  /** Full profile shape aligned with mobile app `GET /app/users/profile` (web dashboard). */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile for web dashboard (same fields as app profile)' })
  async getProfileForDashboard(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }

    const fullUser = await this.customerService.findByUniqueId(user.unique_id);

    return {
      success: true,
      data: {
        id: fullUser.unique_id,
        first_name: fullUser.first_name,
        last_name: fullUser.last_name,
        full_name: formatFullName(fullUser.first_name, fullUser.last_name),
        email: fullUser.email,
        phone_number: fullUser.phone_number,
        gender: fullUser.gender,
        date_of_birth: fullUser.date_of_birth,
        time_of_birth: fullUser.time_of_birth,
        place_name: fullUser.place_name,
        latitude: fullUser.latitude,
        longitude: fullUser.longitude,
        timezone: fullUser.timezone,
        life_role: fullUser.life_role,
        relationship_status: fullUser.relationship_status,
        interests: fullUser.interests ? JSON.parse(fullUser.interests) : [],
        avatar_url: fullUser.avatar_url,
        avatar_img: fullUser.avatar_img,
        nakshatra: fullUser.nakshatra,
        pada: fullUser.pada,
        current_plan: fullUser.current_plan,
        referral_code: fullUser.referral_code,
        is_verified: fullUser.is_verified,
        created_at: fullUser.added_date,
        updated_at: fullUser.modify_date,
      },
    };
  }

  @Get('referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Referred signups (Web)' })
  @ApiResponse({ status: 200, description: 'Pending and completed referrals' })
  async getReferralsList(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.customerService.getReferralListForDashboard(user.id);
    return {
      success: true,
      data,
    };
  }

  @Get('referral-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Referral summary (Web)' })
  @ApiResponse({ status: 200, description: 'Referral stats' })
  async getReferralStatsDashboard(@CurrentUser() user: CurrentUserPayload) {
    const stats = await this.customerService.getReferralStats(user.id);
    const fullUser = await this.customerService.findOne(user.id);
    return {
      success: true,
      data: {
        referral_code: stats.referral_code,
        referral_count: stats.successful_referrals,
        total_referrals: stats.total_referrals,
        referrals_needed: 11,
        referral_limit_awaken_to_builder: 5,
        referral_limit_karma_pro_to_dharma: 51,
        current_plan: fullUser.current_plan,
      },
    };
  }

  @Get('current-dasha')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current Vimshottari lords from stored kundli (Web)' })
  @ApiResponse({ status: 200, description: 'Current dasha levels' })
  async getCurrentDashaForWeb(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.kundliService.getCurrentDashaForDashboard(user.id);
    return {
      success: true,
      data: data ?? {
        current_mahadasha: null,
        current_antardasha: null,
        current_pratyantar: null,
        current_sukshma: null,
      },
    };
  }

  @Post('upgrade-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Assign subscription by plan id or unique_id (Web; direct activation; use payment verify for paid checkout)',
  })
  @ApiResponse({ status: 200, description: 'Plan upgraded' })
  @ApiResponse({ status: 400, description: 'Invalid plan or plan not available' })
  async upgradePlan(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpgradePlanDto,
  ) {
    const plan = await this.plansService.resolveSubscribablePlan({
      unique_id: body.unique_id,
      plan_id: body.plan_id,
    });
    await this.subscriptionsService.createSubscription(user.id, plan.id, new Date());
    return {
      success: true,
      data: {
        plan: plan.plan_type,
        plan_id: Number(plan.id),
        unique_id: plan.unique_id,
      },
    };
  }
}

