"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = exports.CACHE_TTL_METADATA = exports.CACHE_KEY_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_KEY_METADATA = 'cache:key';
exports.CACHE_TTL_METADATA = 'cache:ttl';
const Cache = (key, ttl = 3600) => (0, common_1.SetMetadata)(exports.CACHE_KEY_METADATA, key) && (0, common_1.SetMetadata)(exports.CACHE_TTL_METADATA, ttl);
exports.Cache = Cache;
//# sourceMappingURL=cache.decorator.js.map