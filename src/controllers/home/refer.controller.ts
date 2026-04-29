import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { CustomerService } from '../../users/services/customer.service';

@ApiTags('Refer')
@Controller('refer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReferController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('code')
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

  @Get('stats')
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
}
