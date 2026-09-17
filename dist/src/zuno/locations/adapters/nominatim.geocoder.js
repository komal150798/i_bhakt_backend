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
var NominatimGeocoder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NominatimGeocoder = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const MIN_REQUEST_INTERVAL_MS = 1100;
let NominatimGeocoder = NominatimGeocoder_1 = class NominatimGeocoder {
    constructor(http) {
        this.http = http;
        this.providerName = 'nominatim';
        this.logger = new common_1.Logger(NominatimGeocoder_1.name);
        this.queue = Promise.resolve();
        this.lastRequestAt = 0;
    }
    get baseUrl() {
        return (process.env.ZUNO_NOMINATIM_BASE_URL?.trim() ||
            'https://nominatim.openstreetmap.org');
    }
    get contact() {
        return process.env.ZUNO_GEOCODER_CONTACT?.trim() || null;
    }
    isConfigured() {
        return Boolean(this.contact);
    }
    async search(query) {
        if (!this.isConfigured()) {
            this.logger.warn('ZUNO_GEOCODER_CONTACT is not set. Nominatim requires an identifying contact in the User-Agent, so no request was made.');
            return [];
        }
        const text = query.query?.trim();
        if (!text)
            return [];
        return this.rateLimited(async () => {
            const params = {
                q: text,
                format: 'jsonv2',
                addressdetails: 1,
                limit: Math.min(Math.max(query.limit ?? 5, 1), 10),
            };
            if (query.countryCode) {
                params.countrycodes = query.countryCode.trim().toLowerCase();
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.http.get(`${this.baseUrl}/search`, {
                params,
                timeout: 8000,
                headers: {
                    'User-Agent': `ZUNO/1.0 (${this.contact})`,
                    'Accept-Language': 'en',
                },
            }));
            const body = response.data;
            if (!Array.isArray(body))
                return [];
            return body
                .map((row) => toCandidate(row))
                .filter((c) => c !== null);
        });
    }
    rateLimited(task) {
        const run = this.queue.then(async () => {
            const wait = this.lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
            if (wait > 0)
                await sleep(wait);
            this.lastRequestAt = Date.now();
            return task();
        });
        this.queue = run.catch(() => undefined);
        return run;
    }
};
exports.NominatimGeocoder = NominatimGeocoder;
exports.NominatimGeocoder = NominatimGeocoder = NominatimGeocoder_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], NominatimGeocoder);
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function toCandidate(row) {
    if (!row || typeof row !== 'object')
        return null;
    const r = row;
    const latitude = Number(r.lat);
    const longitude = Number(r.lon);
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude))
        return null;
    const address = (r.address ?? {});
    const name = r.name ||
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        String(r.display_name ?? '').split(',')[0] ||
        'Unknown';
    return {
        displayName: String(r.display_name ?? name),
        name: String(name),
        latitude,
        longitude,
        countryCode: address.country_code
            ? String(address.country_code).toUpperCase()
            : null,
        providerPlaceId: r.place_id != null ? String(r.place_id) : null,
        confidence: confidenceFrom(r),
        featureType: r.addresstype ? String(r.addresstype) : r.type ? String(r.type) : null,
    };
}
function confidenceFrom(row) {
    const importance = Number(row.importance);
    const type = String(row.addresstype ?? row.type ?? '').toLowerCase();
    const isPopulatedPlace = ['city', 'town', 'village', 'municipality', 'suburb'].includes(type);
    if (Number.isFinite(importance) && importance >= 0.55 && isPopulatedPlace)
        return 'HIGH';
    if (Number.isFinite(importance) && importance >= 0.35)
        return 'MEDIUM';
    if (isPopulatedPlace)
        return 'MEDIUM';
    return 'LOW';
}
function isValidLatitude(value) {
    return Number.isFinite(value) && value >= -90 && value <= 90;
}
function isValidLongitude(value) {
    return Number.isFinite(value) && value >= -180 && value <= 180;
}
//# sourceMappingURL=nominatim.geocoder.js.map