"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KundliController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KundliController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kundli_service_1 = require("../services/kundli.service");
const kundli_pdf_service_1 = require("../services/kundli-pdf.service");
const generate_kundli_dto_1 = require("../dto/generate-kundli.dto");
const generate_kundli_pdf_dto_1 = require("../dto/generate-kundli-pdf.dto");
const kundli_response_dto_1 = require("../dto/kundli-response.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let KundliController = KundliController_1 = class KundliController {
    constructor(kundliService, kundliPdfService) {
        this.kundliService = kundliService;
        this.kundliPdfService = kundliPdfService;
        this.logger = new common_1.Logger(KundliController_1.name);
    }
    async generateKundli(dto, req) {
        const userId = req?.user?.id || null;
        return this.kundliService.generateKundli(dto, userId);
    }
    async generateKundliAuthenticated(dto, req) {
        const userId = req.user.id;
        return this.kundliService.generateKundli(dto, userId);
    }
    async generateKundliPdf(dto, req, res) {
        const userId = req.user?.id;
        this.logger.log(`PDF generation requested by user: ${userId}`);
        const pdfBuffer = await this.kundliPdfService.generatePdf(dto);
        const safeName = dto.name.replaceAll(/[^a-zA-Z0-9\s]/g, '').replaceAll(/\s+/g, '_');
        const filename = `Kundli_Report_${safeName}_${Date.now()}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
        res.end(pdfBuffer);
        this.logger.log(`PDF generated successfully for user: ${userId}, filename: ${filename}`);
    }
};
exports.KundliController = KundliController;
__decorate([
    (0, common_1.Post)(),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate kundli (birth chart)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Kundli generated successfully',
        type: kundli_response_dto_1.KundliResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_kundli_dto_1.GenerateKundliDto, Object]),
    __metadata("design:returntype", Promise)
], KundliController.prototype, "generateKundli", null);
__decorate([
    (0, common_1.Post)('authenticated'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Generate kundli for authenticated user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Kundli generated successfully',
        type: kundli_response_dto_1.KundliResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_kundli_dto_1.GenerateKundliDto, Object]),
    __metadata("design:returntype", Promise)
], KundliController.prototype, "generateKundliAuthenticated", null);
__decorate([
    (0, common_1.Post)('pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate Kundli PDF report (authenticated users only)',
        description: 'Generates a PDF report containing birth details, Lagna, Nakshatra, Mahadasha, Antardasha, Pratyantar Dasha, planetary positions, and houses. Requires valid JWT authentication.',
    }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Valid JWT token required',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_kundli_pdf_dto_1.GenerateKundliPdfDto, Object, Object]),
    __metadata("design:returntype", Promise)
], KundliController.prototype, "generateKundliPdf", null);
exports.KundliController = KundliController = KundliController_1 = __decorate([
    (0, swagger_1.ApiTags)('kundli'),
    (0, common_1.Controller)('kundli'),
    __metadata("design:paramtypes", [kundli_service_1.KundliService,
        kundli_pdf_service_1.KundliPdfService])
], KundliController);
//# sourceMappingURL=kundli.controller.js.map