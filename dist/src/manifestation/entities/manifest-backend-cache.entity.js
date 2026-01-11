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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestBackendCache = void 0;
const typeorm_1 = require("typeorm");
let ManifestBackendCache = class ManifestBackendCache {
};
exports.ManifestBackendCache = ManifestBackendCache;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' }),
    __metadata("design:type", String)
], ManifestBackendCache.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'config_json' }),
    __metadata("design:type", Object)
], ManifestBackendCache.prototype, "config_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()', name: 'updated_at' }),
    __metadata("design:type", Date)
], ManifestBackendCache.prototype, "updated_at", void 0);
exports.ManifestBackendCache = ManifestBackendCache = __decorate([
    (0, typeorm_1.Entity)('manifest_backend_cache')
], ManifestBackendCache);
//# sourceMappingURL=manifest-backend-cache.entity.js.map