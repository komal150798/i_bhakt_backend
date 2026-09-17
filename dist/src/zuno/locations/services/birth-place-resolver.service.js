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
var BirthPlaceResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BirthPlaceResolverService = void 0;
const common_1 = require("@nestjs/common");
const geocoder_port_1 = require("../ports/geocoder.port");
const timezone_resolver_service_1 = require("./timezone-resolver.service");
let BirthPlaceResolverService = BirthPlaceResolverService_1 = class BirthPlaceResolverService {
    constructor(geocoder, timezones) {
        this.geocoder = geocoder;
        this.timezones = timezones;
        this.logger = new common_1.Logger(BirthPlaceResolverService_1.name);
    }
    isAvailable() {
        return this.geocoder.isConfigured();
    }
    async resolve(query, countryCode) {
        const text = (query ?? '').trim();
        if (!text) {
            return {
                status: 'NOT_FOUND',
                candidates: [],
                provider: this.geocoder.providerName,
                detail: 'empty query',
            };
        }
        if (!this.geocoder.isConfigured()) {
            return {
                status: 'UNAVAILABLE',
                candidates: [],
                provider: this.geocoder.providerName,
                detail: 'no geocoding provider configured',
            };
        }
        let raw;
        try {
            raw = await this.geocoder.search({
                query: text,
                countryCode: countryCode ?? null,
                limit: 5,
            });
        }
        catch (error) {
            this.logger.warn(`Geocoding provider "${this.geocoder.providerName}" failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                status: 'UNAVAILABLE',
                candidates: [],
                provider: this.geocoder.providerName,
                detail: 'provider request failed',
            };
        }
        const candidates = raw.map((c) => ({
            ...c,
            timezone: this.timezones.timezoneForCoordinates(c.latitude, c.longitude),
        }));
        const usable = candidates.filter((c) => c.timezone !== null);
        if (usable.length === 0) {
            return {
                status: candidates.length > 0 ? 'AMBIGUOUS' : 'NOT_FOUND',
                candidates,
                provider: this.geocoder.providerName,
                detail: candidates.length > 0
                    ? 'matches found but none resolved to a timezone'
                    : 'no matches',
            };
        }
        const high = usable.filter((c) => c.confidence === 'HIGH');
        if (high.length === 1 && usable.length === 1) {
            return {
                status: 'RESOLVED',
                candidates: high,
                provider: this.geocoder.providerName,
            };
        }
        if (high.length === 1 && usable.every((c) => c === high[0] || c.confidence === 'LOW')) {
            return {
                status: 'RESOLVED',
                candidates: high,
                provider: this.geocoder.providerName,
            };
        }
        return {
            status: 'AMBIGUOUS',
            candidates: usable,
            provider: this.geocoder.providerName,
            detail: `${usable.length} plausible matches`,
        };
    }
    verifyCoordinate(latitude, longitude) {
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            return { valid: false, timezone: null, reason: 'latitude out of range' };
        }
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            return { valid: false, timezone: null, reason: 'longitude out of range' };
        }
        const timezone = this.timezones.timezoneForCoordinates(latitude, longitude);
        if (!timezone) {
            return {
                valid: false,
                timezone: null,
                reason: 'coordinate resolves to no timezone',
            };
        }
        return { valid: true, timezone };
    }
};
exports.BirthPlaceResolverService = BirthPlaceResolverService;
exports.BirthPlaceResolverService = BirthPlaceResolverService = BirthPlaceResolverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(geocoder_port_1.GEOCODER)),
    __metadata("design:paramtypes", [Object, timezone_resolver_service_1.TimezoneResolverService])
], BirthPlaceResolverService);
//# sourceMappingURL=birth-place-resolver.service.js.map