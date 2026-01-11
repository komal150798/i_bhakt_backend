"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoroscopeModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const astrology_module_1 = require("../astrology/astrology.module");
const horoscope_service_1 = require("./services/horoscope.service");
const horoscope_controller_1 = require("./controllers/horoscope.controller");
const customer_entity_1 = require("../users/entities/customer.entity");
let HoroscopeModule = class HoroscopeModule {
};
exports.HoroscopeModule = HoroscopeModule;
exports.HoroscopeModule = HoroscopeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forFeature([customer_entity_1.Customer]),
            astrology_module_1.AstrologyModule,
        ],
        controllers: [horoscope_controller_1.HoroscopeController],
        providers: [horoscope_service_1.HoroscopeService],
        exports: [horoscope_service_1.HoroscopeService],
    })
], HoroscopeModule);
//# sourceMappingURL=horoscope.module.js.map