import { Order } from '../../../orders/entities/order.entity';

export interface CreateOrderInput {
  user_id: number;
  plan_id?: number;
  product_id?: number;
  amount: number;
  currency: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrderInput {
  status?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUniqueId(uniqueId: string): Promise<Order | null>;
  findByUserId(userId: number): Promise<Order[]>;
  findAll(options?: { status?: string }): Promise<Order[]>;
  create(data: CreateOrderInput): Promise<Order>;
  update(order: Order, data: UpdateOrderInput): Promise<Order>;
  delete(order: Order): Promise<void>;
}

