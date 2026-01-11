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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeKarmaController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_category_entity_1 = require("../../karma/entities/karma-category.entity");
let HomeKarmaController = class HomeKarmaController {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async getMasterCategories() {
        return this.categoryRepository.find({
            where: { is_active: true },
            order: { name: 'ASC' },
        });
    }
};
exports.HomeKarmaController = HomeKarmaController;
__decorate([
    (0, common_1.Post)('master/categories'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HomeKarmaController.prototype, "getMasterCategories", null);
exports.HomeKarmaController = HomeKarmaController = __decorate([
    (0, common_1.Controller)('home/karma'),
    __param(0, (0, typeorm_1.InjectRepository)(karma_category_entity_1.KarmaCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HomeKarmaController);
//# sourceMappingURL=karma.controller.js.map