import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { IOrderRepository, CreateOrderInput, UpdateOrderInput } from '../../core/interfaces/repositories/order-repository.interface';
export declare class OrderRepository implements IOrderRepository {
    private readonly orderRepository;
    constructor(orderRepository: Repository<Order>);
    findById(id: number): Promise<Order | null>;
    findByUniqueId(uniqueId: string): Promise<Order | null>;
    findByUserId(userId: number): Promise<Order[]>;
    findAll(options?: {
        status?: string;
    }): Promise<Order[]>;
    create(data: CreateOrderInput): Promise<Order>;
    update(order: Order, data: UpdateOrderInput): Promise<Order>;
    delete(order: Order): Promise<void>;
}
