import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { KundliService } from '../services/kundli.service';
import { KundliPdfService } from '../services/kundli-pdf.service';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { GenerateKundliPdfDto } from '../dto/generate-kundli-pdf.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('kundli')
@Controller('kundli')
export class KundliController {
  private readonly logger = new Logger(KundliController.name);

  constructor(
    private readonly kundliService: KundliService,
    private readonly kundliPdfService: KundliPdfService,
  ) {}

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

  /**
   * POST /api/v1/kundli/pdf
   * Generate and download Kundli PDF report
   * PROTECTED ENDPOINT - Requires authentication
   */
  @Post('pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Kundli PDF report (authenticated users only)',
    description:
      'Generates a PDF report containing birth details, Lagna, Nakshatra, Mahadasha, Antardasha, Pratyantar Dasha, planetary positions, and houses. Requires valid JWT authentication.',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async generateKundliPdf(
    @Body() dto: GenerateKundliPdfDto,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    this.logger.log(`PDF generation requested by user: ${userId}`);

    // Generate PDF buffer
    const pdfBuffer = await this.kundliPdfService.generatePdf(dto);

    // Sanitize filename (remove special characters)
    const safeName = dto.name.replaceAll(/[^a-zA-Z0-9\s]/g, '').replaceAll(/\s+/g, '_');
    const filename = `Kundli_Report_${safeName}_${Date.now()}.pdf`;

    // Set response headers for PDF download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    // Send PDF buffer
    res.end(pdfBuffer);

    this.logger.log(`PDF generated successfully for user: ${userId}, filename: ${filename}`);
  }
}


