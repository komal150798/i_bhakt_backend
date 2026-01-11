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
exports.SubscriptionRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subscription_entity_1 = require("../../subscriptions/entities/subscription.entity");
let SubscriptionRepository = class SubscriptionRepository {
    constructor(subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }
    async findById(id) {
        return this.subscriptionRepository.findOne({
            where: { id },
            relations: ['user', 'plan'],
        });
    }
    async findByUniqueId(uniqueId) {
        return this.subscriptionRepository.findOne({
            where: { unique_id: uniqueId },
            relations: ['user', 'plan'],
        });
    }
    async findByUserId(userId, options) {
        const where = { user_id: userId, is_deleted: false };
        if (options?.is_active !== undefined) {
            where.is_active = options.is_active;
        }
        return this.subscriptionRepository.find({
            where,
            relations: ['plan'],
            order: { added_date: 'DESC' },
        });
    }
    async findActiveByUserId(userId) {
        return this.subscriptionRepository.findOne({
            where: {
                user_id: userId,
                is_active: true,
                is_deleted: false,
            },
            relations: ['plan'],
            order: { added_date: 'DESC' },
        });
    }
    async findAll(options) {
        const where = { is_deleted: false };
        if (options?.is_active !== undefined) {
            where.is_active = options.is_active;
        }
        return this.subscriptionRepository.find({ where, relations: ['user', 'plan'] });
    }
    async create(data) {
        const subscription = this.subscriptionRepository.create(data);
        return this.subscriptionRepository.save(subscription);
    }
    async update(subscription, data) {
        Object.assign(subscription, data);
        return this.subscriptionRepository.save(subscription);
    }
    async delete(subscription) {
        subscription.is_deleted = true;
        await this.subscriptionRepository.save(subscription);
    }
};
exports.SubscriptionRepository = SubscriptionRepository;
exports.SubscriptionRepository = SubscriptionRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SubscriptionRepository);
//# sourceMappingURL=subscription.repository.js.map