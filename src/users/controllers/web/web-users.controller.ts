import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UsersService } from '../../services/users.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { User } from '../../entities/user.entity';

@ApiTags('web-users')
@Controller('web/users')
export class WebUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (Web)' })
  async getProfile(@CurrentUser() user: any) {
    const fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
    
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
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: Partial<User>,
  ) {
    const updated = await this.usersService.update(user.unique_id, updateData, user.id);
    
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
  async getCurrentPlan(@CurrentUser() user: any) {
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
  async getAllowedModules(@CurrentUser() user: any) {
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
  async getUsageLimits(@CurrentUser() user: any) {
    const limits = await this.usageTrackingService.getUserUsageLimits(user.id);

    return {
      success: true,
      data: limits,
    };
  }
}

