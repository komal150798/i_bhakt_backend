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
exports.ZunoLocationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const birth_place_resolver_service_1 = require("../services/birth-place-resolver.service");
let ZunoLocationsController = class ZunoLocationsController {
    constructor(places) {
        this.places = places;
    }
    async search(q, country) {
        const query = (q ?? '').trim();
        if (query.length < 2) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
                message: 'Enter at least two characters of the place name.',
            });
        }
        const normalisedCountry = (country ?? '').trim().toUpperCase();
        if (normalisedCountry && !/^[A-Z]{2}$/.test(normalisedCountry)) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, {
                message: 'Country must be a two-letter ISO 3166-1 alpha-2 code.',
            });
        }
        const result = await this.places.resolve(query, normalisedCountry || null);
        return new zuno_response_interceptor_1.ZunoPayload(result.candidates.map((c) => ({
            name: c.name,
            displayName: c.displayName,
            latitude: c.latitude,
            longitude: c.longitude,
            countryCode: c.countryCode,
            timezone: c.timezone,
            confidence: c.confidence,
            featureType: c.featureType,
        })), {
            status: result.status,
            provider: result.provider,
            retryable: result.status === 'UNAVAILABLE',
        });
    }
    async availability() {
        return new zuno_response_interceptor_1.ZunoPayload({
            available: this.places.isAvailable(),
        });
    }
};
exports.ZunoLocationsController = ZunoLocationsController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search for a birth place and its timezone' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Place name as typed.' }),
    (0, swagger_1.ApiQuery)({
        name: 'country',
        required: false,
        description: 'ISO 3166-1 alpha-2 hint, e.g. IN.',
    }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ZunoLocationsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Whether a geocoding provider is configured' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZunoLocationsController.prototype, "availability", null);
exports.ZunoLocationsController = ZunoLocationsController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Locations'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('locations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [birth_place_resolver_service_1.BirthPlaceResolverService])
], ZunoLocationsController);
//# sourceMappingURL=locations.controller.js.map