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
exports.PaymentRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../../payments/entities/payment.entity");
let PaymentRepository = class PaymentRepository {
    constructor(paymentRepository) {
        this.paymentRepository = paymentRepository;
    }
    async findById(id) {
        return this.paymentRepository.findOne({ where: { id }, relations: ['order'] });
    }
    async findByUniqueId(uniqueId) {
        return this.paymentRepository.findOne({
            where: { unique_id: uniqueId },
            relations: ['order'],
        });
    }
    async findByOrderId(orderId) {
        return this.paymentRepository.find({
            where: { order_id: orderId },
            relations: ['order'],
            order: { added_date: 'DESC' },
        });
    }
    async findByUserId(userId) {
        return this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.order', 'order')
            .where('order.user_id = :userId', { userId })
            .orderBy('payment.added_date', 'DESC')
            .getMany();
    }
    async findAll(options) {
        const where = { is_deleted: false };
        if (options?.status) {
            where.status = options.status;
        }
        return this.paymentRepository.find({ where, relations: ['order'] });
    }
    async create(data) {
        const payment = this.paymentRepository.create(data);
        return this.paymentRepository.save(payment);
    }
    async update(payment, data) {
        Object.assign(payment, data);
        return this.paymentRepository.save(payment);
    }
    async delete(payment) {
        payment.is_deleted = true;
        await this.paymentRepository.save(payment);
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PaymentRepository);
//# sourceMappingURL=payment.repository.js.map