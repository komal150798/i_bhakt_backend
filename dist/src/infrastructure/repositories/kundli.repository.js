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
exports.KundliRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kundli_entity_1 = require("../../kundli/entities/kundli.entity");
let KundliRepository = class KundliRepository {
    constructor(kundliRepository) {
        this.kundliRepository = kundliRepository;
    }
    async findById(id) {
        return this.kundliRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['planets', 'houses', 'user'],
        });
    }
    async findByUniqueId(uniqueId) {
        return this.kundliRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
            relations: ['planets', 'houses', 'user'],
        });
    }
    async findByUserId(userId, options) {
        return this.kundliRepository.find({
            where: {
                user_id: userId,
                is_deleted: options?.is_deleted ?? false,
            },
            relations: ['planets', 'houses'],
            order: { added_date: 'DESC' },
        });
    }
    async findOneByUserId(userId, options) {
        return this.kundliRepository.findOne({
            where: {
                user_id: userId,
                is_deleted: options?.is_deleted ?? false,
            },
            relations: ['planets', 'houses'],
            order: { added_date: 'DESC' },
        });
    }
    async create(data) {
        const kundli = this.kundliRepository.create(data);
        return this.kundliRepository.save(kundli);
    }
    async update(kundli, data) {
        Object.assign(kundli, data);
        return this.kundliRepository.save(kundli);
    }
    async delete(kundli) {
        kundli.is_deleted = true;
        await this.kundliRepository.save(kundli);
    }
};
exports.KundliRepository = KundliRepository;
exports.KundliRepository = KundliRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kundli_entity_1.Kundli)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], KundliRepository);
//# sourceMappingURL=kundli.repository.js.map