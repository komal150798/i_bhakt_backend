"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NullGeocoder_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullGeocoder = void 0;
const common_1 = require("@nestjs/common");
let NullGeocoder = NullGeocoder_1 = class NullGeocoder {
    constructor() {
        this.providerName = 'none';
        this.logger = new common_1.Logger(NullGeocoder_1.name);
        this.warned = false;
    }
    isConfigured() {
        return false;
    }
    async search(_query) {
        if (!this.warned) {
            this.warned = true;
            this.logger.warn('No geocoding provider configured (ZUNO_GEOCODER). Birth places cannot be resolved to coordinates, so chart-based guidance stays unavailable. Set ZUNO_GEOCODER=nominatim or =opencage to enable it.');
        }
        return [];
    }
};
exports.NullGeocoder = NullGeocoder;
exports.NullGeocoder = NullGeocoder = NullGeocoder_1 = __decorate([
    (0, common_1.Injectable)()
], NullGeocoder);
//# sourceMappingURL=null.geocoder.js.map