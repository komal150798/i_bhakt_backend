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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let UserRepository = class UserRepository {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findById(id) {
        return this.userRepository.findOne({
            where: { id },
        });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({
            where: { email },
        });
    }
    async findByPhoneNumber(phoneNumber) {
        return this.userRepository.findOne({
            where: { phone_number: phoneNumber },
        });
    }
    async findByReferralCode(referralCode) {
        return this.userRepository.findOne({
            where: { referral_code: referralCode },
        });
    }
    async findByRole(role) {
        return this.userRepository.find({
            where: { role },
        });
    }
    async findAll(options) {
        const where = {};
        if (options?.is_deleted !== undefined) {
            where.is_deleted = options.is_deleted;
        }
        if (options?.role) {
            where.role = options.role;
        }
        return this.userRepository.find({ where });
    }
    async create(data) {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }
    async update(user, data) {
        Object.assign(user, data);
        return this.userRepository.save(user);
    }
    async delete(user) {
        if ('is_deleted' in user) {
            user.is_deleted = true;
            await this.userRepository.save(user);
        }
        else {
            await this.userRepository.remove(user);
        }
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserRepository);
//# sourceMappingURL=user.repository.js.map