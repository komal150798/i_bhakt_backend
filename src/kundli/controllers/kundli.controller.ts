import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KundliService } from '../services/kundli.service';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('kundli')
@Controller('kundli')
export class KundliController {
  constructor(private readonly kundliService: KundliService) {}

  /**
   * POST /api/v1/kundli
   * Generate kundli (birth chart) - Public endpoint
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate kundli (birth chart)' })
  @ApiResponse({
    status: 200,
    description: 'Kundli generated successfully',
    type: KundliResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async generateKundli(
    @Body() dto: GenerateKundliDto,
    @Request() req?: any,
  ): Promise<KundliResponseDto> {
    // Use authenticated user ID if available, otherwise null (public access)
    const userId = req?.user?.id || null;
    return this.kundliService.generateKundli(dto, userId);
  }

  /**
   * POST /api/v1/kundli/authenticated
   * Generate kundli for authenticated user
   */
  @Post('authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate kundli for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Kundli generated successfully',
    type: KundliResponseDto,
  })
  async generateKundliAuthenticated(
    @Body() dto: GenerateKundliDto,
    @Request() req: any,
  ): Promise<KundliResponseDto> {
    const userId = req.user.id;
    return this.kundliService.generateKundli(dto, userId);
  }
}


