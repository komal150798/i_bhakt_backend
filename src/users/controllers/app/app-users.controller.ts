import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../../common/types/jwt-payload.interface';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { Customer } from '../../entities/customer.entity';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { parseDateString } from '../../../common/utils/date.util';
import { formatFullName, splitFullName } from '../../../common/utils/string.util';

@ApiTags('app-users')
@Controller('app/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppUsersController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile (Mobile App)' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
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

  @Put('profile')
  @ApiOperation({ summary: 'Update profile (Mobile App)' })
  @ApiBody({ 
    type: UpdateCustomerProfileDto,
    description: 'Profile update data. All fields are optional.',
    examples: {
      basic: {
        summary: 'Basic profile update',
        value: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
        },
      },
      withFullName: {
        summary: 'Update with full_name (will be split into first_name and last_name)',
        value: {
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          gender: 'male',
          life_role: 'Entrepreneur',
          relationship_status: 'single',
          interests: ['yoga', 'meditation', 'astrology'],
          avatar_img: 'https://example.com/avatar.jpg',
        },
      },
      withBirthData: {
        summary: 'Update with birth data for kundli',
        value: {
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-15',
          time_of_birth: '10:30:00',
          place_name: 'Mumbai',
          latitude: 19.0760,
          longitude: 72.8777,
          timezone: 'Asia/Kolkata',
        },
      },
      complete: {
        summary: 'Complete profile update with all new fields',
        value: {
          full_name: 'Jane Smith',
          gender: 'female',
          life_role: 'Teacher',
          date_of_birth: '1995-05-20',
          time_of_birth: '14:45:00',
          place_name: 'Delhi',
          latitude: 28.6139,
          longitude: 77.2090,
          timezone: 'Asia/Kolkata',
          relationship_status: 'married',
          interests: ['reading', 'travel', 'cooking'],
          avatar_img: 'https://example.com/avatar.jpg',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-here',
          name: 'John Doe',
          message: 'Profile updated',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateData: UpdateCustomerProfileDto,
  ) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Update Customer
    const updated = await this.customerService.updateProfile(user.id, updateData);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.unique_id,
        first_name: updated.first_name,
        last_name: updated.last_name,
        full_name: formatFullName(updated.first_name, updated.last_name),
        email: updated.email,
        phone_number: updated.phone_number,
        gender: updated.gender,
        date_of_birth: updated.date_of_birth,
        time_of_birth: updated.time_of_birth,
        place_name: updated.place_name,
        latitude: updated.latitude,
        longitude: updated.longitude,
        timezone: updated.timezone,
        life_role: updated.life_role,
        relationship_status: updated.relationship_status,
        interests: updated.interests ? JSON.parse(updated.interests) : [],
        avatar_url: updated.avatar_url,
        avatar_img: updated.avatar_img,
        nakshatra: updated.nakshatra,
        pada: updated.pada,
        current_plan: updated.current_plan,
        referral_code: updated.referral_code,
        is_verified: updated.is_verified,
        created_at: updated.added_date,
        updated_at: updated.modify_date,
      },
    };
  }

  @Get('current-plan')
  @ApiOperation({ summary: 'Get current subscription plan (Mobile App)' })
  async getCurrentPlan(@CurrentUser() user: CurrentUserPayload) {
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
  async getModules(@CurrentUser() user: CurrentUserPayload) {
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
  async getStats(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Get user from Customer table only
    const fullUser = await this.customerService.findByUniqueId(user.unique_id);
    const limits = await this.usageTrackingService.getUserUsageLimits(user.id);
    
    return {
      success: true,
      data: {
        plan: (fullUser as any).current_plan || (fullUser as any).plan || 'free',
        referral_code: fullUser.referral_code,
        verified: fullUser.is_verified,
        usage: limits,
      },
    };
  }
}

