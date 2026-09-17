"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TimezoneResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimezoneResolverService = void 0;
exports.julianDayFromUtcMillis = julianDayFromUtcMillis;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const geo_tz_1 = require("geo-tz");
let TimezoneResolverService = TimezoneResolverService_1 = class TimezoneResolverService {
    constructor() {
        this.logger = new common_1.Logger(TimezoneResolverService_1.name);
    }
    timezoneForCoordinates(latitude, longitude) {
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
            return null;
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
            return null;
        try {
            const zones = (0, geo_tz_1.find)(latitude, longitude);
            return zones?.length ? zones[0] : null;
        }
        catch (error) {
            this.logger.warn(`Timezone lookup failed for a coordinate: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    isKnownTimezone(zone) {
        if (!zone?.trim())
            return false;
        return luxon_1.DateTime.local().setZone(zone.trim()).isValid;
    }
    resolveLocalToUtc(date, time, zone) {
        const normalisedTime = normaliseTime(time);
        const localIso = `${date}T${normalisedTime}`;
        if (!this.isKnownTimezone(zone)) {
            return unresolved(zone);
        }
        const probe = luxon_1.DateTime.fromISO(localIso, { zone: 'UTC' });
        if (!probe.isValid)
            return unresolved(zone);
        const offsets = new Set();
        for (const hours of [-30, -12, 0, 12, 30]) {
            const at = probe.plus({ hours });
            const offset = luxon_1.DateTime.fromMillis(at.toMillis(), { zone }).offset;
            if (Number.isFinite(offset))
                offsets.add(offset);
        }
        const matches = [];
        for (const offsetMinutes of offsets) {
            const candidateUtcMs = probe.toMillis() - offsetMinutes * 60_000;
            const rendered = luxon_1.DateTime.fromMillis(candidateUtcMs, { zone });
            if (!rendered.isValid)
                continue;
            if (rendered.toFormat('yyyy-MM-dd') === date &&
                rendered.toFormat('HH:mm:ss') === normalisedTime &&
                rendered.offset === offsetMinutes) {
                matches.push({
                    utcIso: new Date(candidateUtcMs).toISOString(),
                    offsetMinutes,
                });
            }
        }
        matches.sort((a, b) => a.utcIso.localeCompare(b.utcIso));
        if (matches.length === 0) {
            return {
                resolution: 'NONEXISTENT',
                utcIso: null,
                julianDayUt: null,
                offsetMinutes: null,
                alternatives: [],
                timezone: zone,
            };
        }
        const chosen = matches[0];
        return {
            resolution: matches.length > 1 ? 'AMBIGUOUS' : 'UNIQUE',
            utcIso: chosen.utcIso,
            julianDayUt: julianDayFromUtcMillis(new Date(chosen.utcIso).getTime()),
            offsetMinutes: chosen.offsetMinutes,
            alternatives: matches.length > 1 ? matches : [],
            timezone: zone,
        };
    }
};
exports.TimezoneResolverService = TimezoneResolverService;
exports.TimezoneResolverService = TimezoneResolverService = TimezoneResolverService_1 = __decorate([
    (0, common_1.Injectable)()
], TimezoneResolverService);
function unresolved(zone) {
    return {
        resolution: 'NONEXISTENT',
        utcIso: null,
        julianDayUt: null,
        offsetMinutes: null,
        alternatives: [],
        timezone: zone,
    };
}
function normaliseTime(time) {
    const trimmed = (time ?? '').trim();
    const parts = trimmed.split(':');
    const hh = (parts[0] ?? '00').padStart(2, '0');
    const mm = (parts[1] ?? '00').padStart(2, '0');
    const ss = (parts[2] ?? '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
function julianDayFromUtcMillis(millis) {
    return millis / 86_400_000 + 2440587.5;
}
//# sourceMappingURL=timezone-resolver.service.js.map