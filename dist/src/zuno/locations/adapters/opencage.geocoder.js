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
var OpenCageGeocoder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCageGeocoder = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let OpenCageGeocoder = OpenCageGeocoder_1 = class OpenCageGeocoder {
    constructor(http) {
        this.http = http;
        this.providerName = 'opencage';
        this.logger = new common_1.Logger(OpenCageGeocoder_1.name);
    }
    get apiKey() {
        return process.env.ZUNO_OPENCAGE_API_KEY?.trim() || null;
    }
    isConfigured() {
        return Boolean(this.apiKey);
    }
    async search(query) {
        if (!this.isConfigured()) {
            this.logger.warn('ZUNO_OPENCAGE_API_KEY is not set; no geocoding request was made.');
            return [];
        }
        const text = query.query?.trim();
        if (!text)
            return [];
        const params = {
            q: text,
            key: this.apiKey,
            limit: Math.min(Math.max(query.limit ?? 5, 1), 10),
            language: 'en',
            no_annotations: 1,
        };
        if (query.countryCode) {
            params.countrycode = query.countryCode.trim().toLowerCase();
        }
        const response = await (0, rxjs_1.firstValueFrom)(this.http.get('https://api.opencagedata.com/geocode/v1/json', {
            params,
            timeout: 8000,
        }));
        const results = response.data?.results;
        if (!Array.isArray(results))
            return [];
        return results
            .map((row) => toCandidate(row))
            .filter((c) => c !== null);
    }
};
exports.OpenCageGeocoder = OpenCageGeocoder;
exports.OpenCageGeocoder = OpenCageGeocoder = OpenCageGeocoder_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], OpenCageGeocoder);
function toCandidate(row) {
    if (!row || typeof row !== 'object')
        return null;
    const r = row;
    const latitude = Number(r.geometry?.lat);
    const longitude = Number(r.geometry?.lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
        return null;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
        return null;
    const components = (r.components ?? {});
    const name = components.city ||
        components.town ||
        components.village ||
        components.municipality ||
        components.county ||
        components.state ||
        String(r.formatted ?? '').split(',')[0] ||
        'Unknown';
    return {
        displayName: String(r.formatted ?? name),
        name: String(name),
        latitude,
        longitude,
        countryCode: components.country_code
            ? String(components.country_code).toUpperCase()
            : null,
        providerPlaceId: null,
        confidence: confidenceFrom(r),
        featureType: r._type ? String(r._type) : components._type ? String(components._type) : null,
    };
}
function confidenceFrom(row) {
    const score = Number(row.confidence);
    if (!Number.isFinite(score))
        return 'LOW';
    if (score >= 8)
        return 'HIGH';
    if (score >= 5)
        return 'MEDIUM';
    return 'LOW';
}
//# sourceMappingURL=opencage.geocoder.js.map