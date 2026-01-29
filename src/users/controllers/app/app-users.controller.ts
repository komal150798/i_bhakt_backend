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
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';

@ApiTags('app-users')
@Controller('app/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly customerService: CustomerService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile (Mobile App) - Screen 07 Review Profile' })
  async getProfile(@CurrentUser() user: any) {
    // Get profile from customer service
    const profile = await this.customerService.getProfile(user.id);
    
    // Format response to match Screen 07 (Review Profile)
    const formattedProfile = {
      name_and_gender: {
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        gender: profile.gender || null,
      },
      life_role: profile.life_role || null,
      birth_details: {
        date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-GB') : null,
        time_of_birth: profile.time_of_birth || null,
        place_of_birth: profile.place_name || null,
        current_city: profile.current_city || null,
      },
      relationship_status: profile.relationship_status || null,
      interests: profile.interests || null,
      contact: {
        email: profile.email || null,
        phone_number: profile.phone_number || null,
      },
      avatar_url: profile.avatar_url || null,
    };
    
    return {
      success: true,
      data: formattedProfile,
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile (Mobile App) - All screens (02-06, 09)' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: UpdateCustomerProfileDto,
  ) {
    // Update profile using customer service
    const updated = await this.customerService.updateProfile(user.id, updateData);
    
    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.id,
        unique_id: updated.unique_id,
        name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'User',
        email: updated.email,
        phone_number: updated.phone_number,
        gender: updated.gender,
        life_role: updated.life_role || null,
        relationship_status: updated.relationship_status || null,
        interests: updated.interests || null,
        current_city: updated.current_city || null,
        avatar_url: updated.avatar_url,
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

