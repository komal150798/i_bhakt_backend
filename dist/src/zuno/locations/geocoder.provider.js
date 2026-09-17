"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocoderProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const geocoder_port_1 = require("./ports/geocoder.port");
const nominatim_geocoder_1 = require("./adapters/nominatim.geocoder");
const opencage_geocoder_1 = require("./adapters/opencage.geocoder");
const null_geocoder_1 = require("./adapters/null.geocoder");
exports.GeocoderProvider = {
    provide: geocoder_port_1.GEOCODER,
    inject: [axios_1.HttpService],
    useFactory: (http) => {
        const logger = new common_1.Logger('GeocoderProvider');
        const selected = (process.env.ZUNO_GEOCODER ?? '').trim().toLowerCase();
        switch (selected) {
            case 'nominatim': {
                const adapter = new nominatim_geocoder_1.NominatimGeocoder(http);
                logger.log(adapter.isConfigured()
                    ? 'Geocoding provider: nominatim'
                    : 'Geocoding provider nominatim selected but ZUNO_GEOCODER_CONTACT is missing; lookups will be refused.');
                return adapter;
            }
            case 'opencage': {
                const adapter = new opencage_geocoder_1.OpenCageGeocoder(http);
                logger.log(adapter.isConfigured()
                    ? 'Geocoding provider: opencage'
                    : 'Geocoding provider opencage selected but ZUNO_OPENCAGE_API_KEY is missing; lookups will be refused.');
                return adapter;
            }
            default: {
                if (selected) {
                    logger.error(`Unknown ZUNO_GEOCODER "${selected}". Falling back to the null geocoder; birth places will not resolve.`);
                }
                return new null_geocoder_1.NullGeocoder();
            }
        }
    },
};
//# sourceMappingURL=geocoder.provider.js.map