import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UsersService } from '../../services/users.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { User } from '../../entities/user.entity';

@ApiTags('app-users')
@Controller('app/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile (Mobile App)' })
  async getProfile(@CurrentUser() user: any) {
    const fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
    
    // Optimized response for mobile app (minimal data)
    return {
      success: true,
      data: {
        id: fullUser.unique_id,
        name: `${fullUser.first_name || ''} ${fullUser.last_name || ''}`.trim() || 'User',
        email: fullUser.email,
        phone: fullUser.phone_number,
        plan: fullUser.current_plan,
        avatar: fullUser.avatar_url,
        verified: fullUser.is_verified,
      },
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile (Mobile App)' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: Partial<User>,
  ) {
    const updated = await this.usersService.update(user.unique_id, updateData, user.id);
    
    return {
      success: true,
      data: {
        id: updated.unique_id,
        name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'User',
        message: 'Profile updated',
      },
    };
  }

  @Get('current-plan')
  @ApiOperation({ summary: 'Get current subscription plan (Mobile App)' })
  async getCurrentPlan(@CurrentUser() user: any) {
    const planType = await this.subscriptionsService.getCurrentPlanType(user.id);
    const subscription = await this.subscriptionsService.getCurrentSubscription(user.id);
    
    return {
      success: true,
      data: {
        plan: planType,
        active: subscription?.is_active || false,
        expires: subscription?.end_date || null,
      },
    };
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get allowed modules (Mobile App)' })
  async getModules(@CurrentUser() user: any) {
    const modules = await this.subscriptionsService.getUserModules(user.id);
    
    return {
      success: true,
      data: {
        modules,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user stats (Mobile App)' })
  async getStats(@CurrentUser() user: any) {
    const fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
    const limits = await this.usageTrackingService.getUserUsageLimits(user.id);
    
    return {
      success: true,
      data: {
        plan: fullUser.current_plan,
        referral_code: fullUser.referral_code,
        verified: fullUser.is_verified,
        usage: limits,
      },
    };
  }
}

