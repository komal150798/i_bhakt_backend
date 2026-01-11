import { Response } from 'express';
import { KundliService } from '../services/kundli.service';
import { KundliPdfService } from '../services/kundli-pdf.service';
import { GenerateKundliDto } from '../dto/generate-kundli.dto';
import { GenerateKundliPdfDto } from '../dto/generate-kundli-pdf.dto';
import { KundliResponseDto } from '../dto/kundli-response.dto';
export declare class KundliController {
    private readonly kundliService;
    private readonly kundliPdfService;
    private readonly logger;
    constructor(kundliService: KundliService, kundliPdfService: KundliPdfService);
    generateKundli(dto: GenerateKundliDto, req?: any): Promise<KundliResponseDto>;
    generateKundliAuthenticated(dto: GenerateKundliDto, req: any): Promise<KundliResponseDto>;
    generateKundliPdf(dto: GenerateKundliPdfDto, req: any, res: Response): Promise<void>;
}
