import { Payment } from '../../../payments/entities/payment.entity';

export interface CreatePaymentInput {
  order_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentInput {
  status?: string;
  transaction_id?: string;
  metadata?: Record<string, any>;
}

export interface IPaymentRepository {
  findById(id: number): Promise<Payment | null>;
  findByUniqueId(uniqueId: string): Promise<Payment | null>;
  findByOrderId(orderId: number): Promise<Payment[]>;
  findByUserId(userId: number): Promise<Payment[]>;
  findAll(options?: { status?: string }): Promise<Payment[]>;
  create(data: CreatePaymentInput): Promise<Payment>;
  update(payment: Payment, data: UpdatePaymentInput): Promise<Payment>;
  delete(payment: Payment): Promise<void>;
}

