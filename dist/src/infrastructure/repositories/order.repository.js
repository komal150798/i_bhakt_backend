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
exports.OrderRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../../orders/entities/order.entity");
let OrderRepository = class OrderRepository {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async findById(id) {
        return this.orderRepository.findOne({ where: { id }, relations: ['user', 'plan', 'product'] });
    }
    async findByUniqueId(uniqueId) {
        return this.orderRepository.findOne({
            where: { unique_id: uniqueId },
            relations: ['user', 'plan', 'product'],
        });
    }
    async findByUserId(userId) {
        return this.orderRepository.find({
            where: { user_id: userId },
            relations: ['plan', 'product'],
            order: { added_date: 'DESC' },
        });
    }
    async findAll(options) {
        const where = { is_deleted: false };
        if (options?.status) {
            where.status = options.status;
        }
        return this.orderRepository.find({ where, relations: ['user', 'plan', 'product'] });
    }
    async create(data) {
        const order = this.orderRepository.create(data);
        return this.orderRepository.save(order);
    }
    async update(order, data) {
        Object.assign(order, data);
        return this.orderRepository.save(order);
    }
    async delete(order) {
        order.is_deleted = true;
        await this.orderRepository.save(order);
    }
};
exports.OrderRepository = OrderRepository;
exports.OrderRepository = OrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OrderRepository);
//# sourceMappingURL=order.repository.js.map