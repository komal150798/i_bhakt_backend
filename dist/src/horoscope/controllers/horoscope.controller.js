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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoroscopeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const horoscope_service_1 = require("../services/horoscope.service");
const get_horoscope_dto_1 = require("../dto/get-horoscope.dto");
const horoscope_response_dto_1 = require("../dto/horoscope-response.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let HoroscopeController = class HoroscopeController {
    constructor(horoscopeService) {
        this.horoscopeService = horoscopeService;
    }
    async getHoroscope(dto, req) {
        if (req?.user?.id && !dto.sign) {
            return this.horoscopeService.getHoroscopeForUser(req.user.id, dto.type);
        }
        if (req?.user?.id && dto.sign) {
            return this.horoscopeService.getHoroscope(dto);
        }
        if (!dto.sign) {
            throw new common_1.BadRequestException('Zodiac sign is required for non-authenticated users');
        }
        return this.horoscopeService.getHoroscope(dto);
    }
    async getMyHoroscope(body, req) {
        const userId = req.user.id;
        const type = body.type || 'daily';
        return this.horoscopeService.getHoroscopeForUser(userId, type);
    }
};
exports.HoroscopeController = HoroscopeController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get horoscope for a zodiac sign (or authenticated user)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Horoscope retrieved successfully',
        type: horoscope_response_dto_1.HoroscopeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_horoscope_dto_1.GetHoroscopeDto, Object]),
    __metadata("design:returntype", Promise)
], HoroscopeController.prototype, "getHoroscope", null);
__decorate([
    (0, common_1.Post)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized horoscope for authenticated user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Personalized horoscope retrieved successfully',
        type: horoscope_response_dto_1.HoroscopeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Birth date not found in profile',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HoroscopeController.prototype, "getMyHoroscope", null);
exports.HoroscopeController = HoroscopeController = __decorate([
    (0, swagger_1.ApiTags)('horoscope'),
    (0, common_1.Controller)('horoscope'),
    __metadata("design:paramtypes", [horoscope_service_1.HoroscopeService])
], HoroscopeController);
//# sourceMappingURL=horoscope.controller.js.map