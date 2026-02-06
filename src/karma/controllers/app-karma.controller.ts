import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KarmaService } from '../services/karma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../common/types/jwt-payload.interface';
import { RecordKarmaDto } from '../dtos/record-karma.dto';

@ApiTags('Karma (App)')
@Controller('app/karma')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppKarmaController {
  constructor(private readonly karmaService: KarmaService) {}

  /**
   * Screen 02.1 - Karma Ledger (Main Dashboard)
   * GET /api/v1/app/karma/ledger
   */
  @Get('ledger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Karma Ledger dashboard (Screen 02.1)' })
  @ApiResponse({
    status: 200,
    description: 'Karma ledger data with awareness level, distribution, and tips',
  })
  async getKarmaLedger(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.karmaService.getKarmaLedger(user.id);
    return { success: true, data };
  }

  /**
   * Screen 02.2 & 02.3 - Record Karma
   * POST /api/v1/app/karma/record
   */
  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a karma action (Screen 02.2 & 02.3)' })
  @ApiBody({
    type: RecordKarmaDto,
    description: 'Karma action with type and description',
    examples: {
      good: {
        summary: 'Record a good karma action',
        value: {
          karma_type: 'good',
          description: 'Helped a colleague with a difficult project without being asked.',
          intention: 'Genuine support',
          emotional_context: 'Compassion and satisfaction',
        },
      },
      neutral: {
        summary: 'Record a neutral karma action',
        value: {
          karma_type: 'neutral',
          description: 'Observed a conflict without taking sides.',
        },
      },
      challenging: {
        summary: 'Record a challenging karma action',
        value: {
          karma_type: 'challenging',
          description: 'Lost patience during a meeting.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Karma action recorded successfully with confirmation',
  })
  async recordKarma(
    @Body() dto: RecordKarmaDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.karmaService.recordKarma({
      user_id: user.id,
      karma_type: dto.karma_type,
      description: dto.description,
      intention: dto.intention,
      emotional_context: dto.emotional_context,
    });
    return { success: true, data };
  }

  /**
   * Screen 02.5B - Karma List with Filters
   * GET /api/v1/app/karma/list?filter=all|good|neutral|challenging
   *
   * NOTE: This must be defined BEFORE the /:id route
   * to avoid 'list' being captured as an :id param.
   */
  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma entries list with filters (Screen 02.5B)' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['all', 'good', 'neutral', 'challenging'],
    description: 'Filter karma entries by type',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered karma entries list with legend',
  })
  async getKarmaList(
    @CurrentUser() user: CurrentUserPayload,
    @Query('filter') filter?: string,
  ) {
    const data = await this.karmaService.getKarmaList(user.id, filter);
    return { success: true, data };
  }

  /**
   * Screen 02.7 - Karma Patterns (Awareness over time)
   * GET /api/v1/app/karma/patterns?filter=week|month|year
   */
  @Get('patterns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma patterns chart data (Screen 02.7)' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['week', 'month', 'year'],
    description: 'Time range filter for patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'Karma patterns chart data with daily/monthly breakdown',
  })
  async getKarmaPatterns(
    @CurrentUser() user: CurrentUserPayload,
    @Query('filter') filter?: string,
  ) {
    const data = await this.karmaService.getKarmaPatterns(user.id, filter);
    return { success: true, data };
  }

  /**
   * Screen 02.4 - Karma Insight for a specific entry
   * GET /api/v1/app/karma/:id/insight
   */
  @Get(':id/insight')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma insight for a specific entry (Screen 02.4)' })
  @ApiParam({ name: 'id', type: Number, description: 'Karma entry ID' })
  @ApiResponse({
    status: 200,
    description: 'Karma insight with alignment gauge and description',
  })
  async getKarmaInsight(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.karmaService.getKarmaInsight(id, user.id);
    return { success: true, data };
  }

  /**
   * Screen 02.5A - Karma Entry Details
   * GET /api/v1/app/karma/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get karma entry details (Screen 02.5A)' })
  @ApiParam({ name: 'id', type: Number, description: 'Karma entry ID' })
  @ApiResponse({
    status: 200,
    description: 'Full karma entry details with teaching and phase impact',
  })
  async getKarmaEntry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.karmaService.getKarmaEntryById(id, user.id);
    return { success: true, data };
  }
}
