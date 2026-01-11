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
exports.RedisConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RedisConfigService = class RedisConfigService {
    constructor(configService) {
        this.configService = configService;
    }
    get host() {
        return this.configService.get('redis.host', 'localhost');
    }
    get port() {
        return this.configService.get('redis.port', 6379);
    }
    get password() {
        return this.configService.get('redis.password');
    }
    get db() {
        return this.configService.get('redis.db', 0);
    }
    get ttl() {
        return this.configService.get('redis.ttl', 3600);
    }
    get keyPrefix() {
        return this.configService.get('redis.keyPrefix', 'ibhakt:');
    }
};
exports.RedisConfigService = RedisConfigService;
exports.RedisConfigService = RedisConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisConfigService);
//# sourceMappingURL=redis-config.service.js.map