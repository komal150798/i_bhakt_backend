import { Repository } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import { IPaymentRepository, CreatePaymentInput, UpdatePaymentInput } from '../../core/interfaces/repositories/payment-repository.interface';
export declare class PaymentRepository implements IPaymentRepository {
    private readonly paymentRepository;
    constructor(paymentRepository: Repository<Payment>);
    findById(id: number): Promise<Payment | null>;
    findByUniqueId(uniqueId: string): Promise<Payment | null>;
    findByOrderId(orderId: number): Promise<Payment[]>;
    findByUserId(userId: number): Promise<Payment[]>;
    findAll(options?: {
        status?: string;
    }): Promise<Payment[]>;
    create(data: CreatePaymentInput): Promise<Payment>;
    update(payment: Payment, data: UpdatePaymentInput): Promise<Payment>;
    delete(payment: Payment): Promise<void>;
}
