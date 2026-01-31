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
import { UsersService } from '../../services/users.service';
import { CustomerService } from '../../services/customer.service';
import { SubscriptionsService } from '../../../subscriptions/services/subscriptions.service';
import { UsageTrackingService } from '../../../subscriptions/services/usage-tracking.service';
import { User } from '../../entities/user.entity';
import { Customer } from '../../entities/customer.entity';
import { UpdateCustomerProfileDto } from '../../dtos/update-customer-profile.dto';
import { parseDateString } from '../../../common/utils/date.util';
import { formatFullName } from '../../../common/utils/string.util';

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
  @ApiOperation({ summary: 'Get user profile (Mobile App)' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    if (!user.unique_id) {
      throw new BadRequestException('User unique_id is missing');
    }
    
    // Check both Customer and User tables (Google login creates Customers)
    let fullUser: User | Customer | null = null;
    try {
      // Try Customer table first (for Google logins and new users)
      fullUser = await this.customerService.findByUniqueId(user.unique_id);
    } catch (error) {
      // If not found in Customer, try User table (for legacy users)
      try {
        fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
      } catch (userError) {
        throw new NotFoundException(`User with unique ID ${user.unique_id} not found in Customer or User table`);
      }
    }
    
    // Optimized response for mobile app (minimal data)
    return {
      success: true,
      data: {
        id: fullUser.unique_id,
        name: formatFullName(fullUser.first_name, fullUser.last_name),
        email: fullUser.email,
        phone: fullUser.phone_number,
        plan: (fullUser as any).current_plan || (fullUser as any).plan || 'free',
        avatar: (fullUser as any).avatar_url || null,
        verified: (fullUser as any).is_verified || false,
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
    
    // Check both Customer and User tables
    let fullUser: User | Customer | null = null;
    let isCustomer = false;
    try {
      fullUser = await this.customerService.findByUniqueId(user.unique_id);
      isCustomer = true;
    } catch (error) {
      try {
        fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
        isCustomer = false;
      } catch (userError) {
        throw new NotFoundException(`User with unique ID ${user.unique_id} not found`);
      }
    }
    
    // Update based on user type
    let updated: User | Customer;
    if (isCustomer) {
      // Update Customer
      updated = await this.customerService.updateProfile(user.id, updateData);
    } else {
      // Update User - convert DTO to User entity format (handle date conversion)
      const userUpdateData: Partial<User> = {};
      // Copy all fields except date_of_birth
      Object.keys(updateData).forEach(key => {
        if (key !== 'date_of_birth') {
          (userUpdateData as any)[key] = (updateData as any)[key];
        }
      });
      if (updateData.date_of_birth) {
        userUpdateData.date_of_birth = parseDateString(updateData.date_of_birth);
      }
      updated = await this.usersService.update(user.unique_id, userUpdateData, user.id);
    }
    
    return {
      success: true,
      data: {
        id: updated.unique_id,
        name: formatFullName(updated.first_name, updated.last_name),
        message: 'Profile updated',
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
    
    // Check both Customer and User tables
    let fullUser: User | Customer | null = null;
    try {
      fullUser = await this.customerService.findByUniqueId(user.unique_id);
    } catch (error) {
      try {
        fullUser = await this.usersService.findOneByUniqueId(user.unique_id);
      } catch (userError) {
        throw new NotFoundException(`User with unique ID ${user.unique_id} not found`);
      }
    }
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

