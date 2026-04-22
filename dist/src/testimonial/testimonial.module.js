"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const testimonial_entity_1 = require("./entities/testimonial.entity");
const testimonial_service_1 = require("./testimonial.service");
const testimonial_controller_1 = require("./testimonial.controller");
let TestimonialModule = class TestimonialModule {
};
exports.TestimonialModule = TestimonialModule;
exports.TestimonialModule = TestimonialModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([testimonial_entity_1.Testimonial])],
        controllers: [testimonial_controller_1.TestimonialController],
        providers: [testimonial_service_1.TestimonialService],
        exports: [testimonial_service_1.TestimonialService],
    })
], TestimonialModule);
//# sourceMappingURL=testimonial.module.js.map