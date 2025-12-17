import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import {
  IOrderRepository,
  CreateOrderInput,
  UpdateOrderInput,
} from '../../core/interfaces/repositories/order-repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findById(id: number): Promise<Order | null> {
    return this.orderRepository.findOne({ where: { id }, relations: ['user', 'plan', 'product'] });
  }

  async findByUniqueId(uniqueId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { unique_id: uniqueId },
      relations: ['user', 'plan', 'product'],
    });
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user_id: userId },
      relations: ['plan', 'product'],
      order: { added_date: 'DESC' },
    });
  }

  async findAll(options?: { status?: string }): Promise<Order[]> {
    const where: any = { is_deleted: false };
    if (options?.status) {
      where.status = options.status;
    }
    return this.orderRepository.find({ where, relations: ['user', 'plan', 'product'] });
  }

  async create(data: CreateOrderInput): Promise<Order> {
    const order = this.orderRepository.create(data);
    return this.orderRepository.save(order);
  }

  async update(order: Order, data: UpdateOrderInput): Promise<Order> {
    Object.assign(order, data);
    return this.orderRepository.save(order);
  }

  async delete(order: Order): Promise<void> {
    order.is_deleted = true;
    await this.orderRepository.save(order);
  }
}

