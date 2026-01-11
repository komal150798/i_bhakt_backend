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
exports.KarmaRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const karma_entry_entity_1 = require("../../karma/entities/karma-entry.entity");
let KarmaRepository = class KarmaRepository {
    constructor(karmaRepository) {
        this.karmaRepository = karmaRepository;
    }
    async findById(id) {
        return this.karmaRepository.findOne({ where: { id, is_deleted: false }, relations: ['customer'] });
    }
    async findByUniqueId(uniqueId) {
        return this.karmaRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
            relations: ['customer'],
        });
    }
    buildWhereClause(userId, options) {
        const where = { is_deleted: options?.is_deleted ?? false };
        if (userId !== undefined) {
            where.user_id = userId;
        }
        if (options?.karma_type) {
            where.karma_type = options.karma_type;
        }
        return where;
    }
    async findByUserId(userId, options) {
        const where = this.buildWhereClause(userId, options);
        return this.karmaRepository.find({ where, order: { added_date: 'DESC' } });
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        return this.karmaRepository.find({
            where: {
                user_id: userId,
                is_deleted: false,
                entry_date: (0, typeorm_2.Between)(startDate, endDate),
            },
            order: { added_date: 'DESC' },
        });
    }
    async findAll(options) {
        const where = this.buildWhereClause(undefined, options);
        return this.karmaRepository.find({ where, relations: ['customer'], order: { added_date: 'DESC' } });
    }
    async create(data) {
        const karmaEntry = this.karmaRepository.create(data);
        return this.karmaRepository.save(karmaEntry);
    }
    async update(karmaEntry, data) {
        Object.assign(karmaEntry, data);
        return this.karmaRepository.save(karmaEntry);
    }
    async delete(karmaEntry) {
        karmaEntry.is_deleted = true;
        await this.karmaRepository.save(karmaEntry);
    }
};
exports.KarmaRepository = KarmaRepository;
exports.KarmaRepository = KarmaRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(karma_entry_entity_1.KarmaEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], KarmaRepository);
//# sourceMappingURL=karma.repository.js.map