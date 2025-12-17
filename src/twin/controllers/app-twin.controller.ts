import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TwinStateService } from '../services/twin-state.service';

@ApiTags('app-twin')
@Controller('app/twin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppTwinController {
  constructor(private readonly twinStateService: TwinStateService) {}

  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current digital twin state' })
  @ApiResponse({ status: 200, description: 'Twin state retrieved successfully' })
  async getTwinState(@CurrentUser() user: any) {
    const state = await this.twinStateService.getTwinState(user.id);
    return {
      success: true,
      data: state,
    };
  }
}

