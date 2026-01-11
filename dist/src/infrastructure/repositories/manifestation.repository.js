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
exports.ManifestationRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const manifestation_log_entity_1 = require("../../manifestation/entities/manifestation-log.entity");
let ManifestationRepository = class ManifestationRepository {
    constructor(manifestationRepository) {
        this.manifestationRepository = manifestationRepository;
    }
    async findById(id) {
        return this.manifestationRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['user'],
        });
    }
    async findByUniqueId(uniqueId) {
        return this.manifestationRepository.findOne({
            where: { unique_id: uniqueId, is_deleted: false },
            relations: ['user'],
        });
    }
    async findByUserId(userId) {
        return this.manifestationRepository.find({
            where: { user_id: userId, is_deleted: false },
            order: { added_date: 'DESC' },
        });
    }
    async findAll(options) {
        const where = { is_deleted: options?.is_deleted ?? false };
        return this.manifestationRepository.find({
            where,
            relations: ['user'],
            order: { added_date: 'DESC' },
        });
    }
    async create(data) {
        const manifestationLog = this.manifestationRepository.create(data);
        return this.manifestationRepository.save(manifestationLog);
    }
    async update(manifestationLog, data) {
        Object.assign(manifestationLog, data);
        return this.manifestationRepository.save(manifestationLog);
    }
    async delete(manifestationLog) {
        manifestationLog.is_deleted = true;
        await this.manifestationRepository.save(manifestationLog);
    }
};
exports.ManifestationRepository = ManifestationRepository;
exports.ManifestationRepository = ManifestationRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(manifestation_log_entity_1.ManifestationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ManifestationRepository);
//# sourceMappingURL=manifestation.repository.js.map