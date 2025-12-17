import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import {
  IPaymentRepository,
  CreatePaymentInput,
  UpdatePaymentInput,
} from '../../core/interfaces/repositories/payment-repository.interface';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findById(id: number): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id }, relations: ['order'] });
  }

  async findByUniqueId(uniqueId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { unique_id: uniqueId },
      relations: ['order'],
    });
  }

  async findByOrderId(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order_id: orderId },
      relations: ['order'],
      order: { added_date: 'DESC' },
    });
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('order.user_id = :userId', { userId })
      .orderBy('payment.added_date', 'DESC')
      .getMany();
  }

  async findAll(options?: { status?: string }): Promise<Payment[]> {
    const where: any = { is_deleted: false };
    if (options?.status) {
      where.status = options.status;
    }
    return this.paymentRepository.find({ where, relations: ['order'] });
  }

  async create(data: CreatePaymentInput): Promise<Payment> {
    const payment = this.paymentRepository.create(data);
    return this.paymentRepository.save(payment);
  }

  async update(payment: Payment, data: UpdatePaymentInput): Promise<Payment> {
    Object.assign(payment, data);
    return this.paymentRepository.save(payment);
  }

  async delete(payment: Payment): Promise<void> {
    payment.is_deleted = true;
    await this.paymentRepository.save(payment);
  }
}

