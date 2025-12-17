import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EntitlementsService } from '../services/entitlements.service';

@ApiTags('app-entitlements')
@Controller('app/entitlements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppEntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user entitlements based on current plan' })
  @ApiResponse({ status: 200, description: 'Entitlements retrieved successfully' })
  async getEntitlements(@CurrentUser() user: any) {
    const entitlements = await this.entitlementsService.getUserEntitlements(user.id);
    return {
      success: true,
      data: entitlements,
    };
  }

  @Get('check/:feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if user has access to a specific feature' })
  @ApiResponse({ status: 200, description: 'Feature access check result' })
  async checkFeatureAccess(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ) {
    const hasAccess = await this.entitlementsService.hasFeatureAccess(user.id, feature);
    return {
      success: true,
      data: {
        feature,
        allowed: hasAccess,
      },
    };
  }
}

