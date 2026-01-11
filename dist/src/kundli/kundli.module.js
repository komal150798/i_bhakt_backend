"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KundliModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const kundli_entity_1 = require("./entities/kundli.entity");
const kundli_planet_entity_1 = require("./entities/kundli-planet.entity");
const kundli_house_entity_1 = require("./entities/kundli-house.entity");
const planet_master_entity_1 = require("./entities/planet-master.entity");
const nakshatra_master_entity_1 = require("./entities/nakshatra-master.entity");
const ayanamsa_master_entity_1 = require("./entities/ayanamsa-master.entity");
const cache_module_1 = require("../cache/cache.module");
const repositories_module_1 = require("../infrastructure/repositories/repositories.module");
const astrology_module_1 = require("../astrology/astrology.module");
const kundli_service_1 = require("./services/kundli.service");
const kundli_pdf_service_1 = require("./services/kundli-pdf.service");
const kundli_controller_1 = require("./controllers/kundli.controller");
let KundliModule = class KundliModule {
};
exports.KundliModule = KundliModule;
exports.KundliModule = KundliModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                kundli_entity_1.Kundli,
                kundli_planet_entity_1.KundliPlanet,
                kundli_house_entity_1.KundliHouse,
                planet_master_entity_1.PlanetMaster,
                nakshatra_master_entity_1.NakshatraMaster,
                ayanamsa_master_entity_1.AyanamsaMaster,
            ]),
            axios_1.HttpModule,
            cache_module_1.CacheModule,
            repositories_module_1.RepositoriesModule,
            astrology_module_1.AstrologyModule,
        ],
        controllers: [kundli_controller_1.KundliController],
        providers: [kundli_service_1.KundliService, kundli_pdf_service_1.KundliPdfService],
        exports: [kundli_service_1.KundliService, kundli_pdf_service_1.KundliPdfService],
    })
], KundliModule);
//# sourceMappingURL=kundli.module.js.map