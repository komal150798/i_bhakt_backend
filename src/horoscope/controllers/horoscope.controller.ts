import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HoroscopeService } from '../services/horoscope.service';
import { GetHoroscopeDto } from '../dto/get-horoscope.dto';
import { HoroscopeResponseDto } from '../dto/horoscope-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('horoscope')
@Controller('horoscope')
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}

  /**
   * POST /api/v1/horoscope
   * Get horoscope (daily, weekly, or monthly) - Public endpoint with optional authentication
   * If user is authenticated and no sign provided, uses user's birth date
   */
  @Post()
  @UseGuards(JwtAuthGuard) // Use guard but allow optional auth via @Public
  @Public() // Mark as public so guard doesn't throw on missing token
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get horoscope for a zodiac sign (or authenticated user)' })
  @ApiResponse({
    status: 200,
    description: 'Horoscope retrieved successfully',
    type: HoroscopeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async getHoroscope(
    @Body() dto: GetHoroscopeDto,
    @Request() req: any,
  ): Promise<HoroscopeResponseDto> {
    // If user is authenticated and no sign provided, get personalized horoscope
    if (req?.user?.id && !dto.sign) {
      return this.horoscopeService.getHoroscopeForUser(req.user.id, dto.type);
    }

    // If user is authenticated and sign is provided, use provided sign (override)
    if (req?.user?.id && dto.sign) {
      // User is logged in but chose a specific sign, use that sign
      return this.horoscopeService.getHoroscope(dto);
    }

    // Otherwise, use provided sign (public access)
    if (!dto.sign) {
      throw new BadRequestException('Zodiac sign is required for non-authenticated users');
    }

    return this.horoscopeService.getHoroscope(dto);
  }

  /**
   * POST /api/v1/horoscope/my
   * Get personalized horoscope for authenticated user
   */
  @Post('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get personalized horoscope for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Personalized horoscope retrieved successfully',
    type: HoroscopeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Birth date not found in profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyHoroscope(
    @Body() body: { type?: 'daily' | 'weekly' | 'monthly' },
    @Request() req: any,
  ): Promise<HoroscopeResponseDto> {
    const userId = req.user.id;
    const type = body.type || 'daily';
    return this.horoscopeService.getHoroscopeForUser(userId, type);
  }
}

