import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
@Index(['user_id', 'payment_status', 'is_deleted'])
@Index(['order_id', 'payment_status'])
export class Payment extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true, name: 'transaction_id' })
  transaction_id: string;

  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'bigint', name: 'order_id' })
  order_id: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING, name: 'payment_status' })
  payment_status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount' })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  payment_method: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'gateway' })
  gateway: string | null;

  @Column({ type: 'text', nullable: true, name: 'gateway_response' })
  gateway_response: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'refunded_at' })
  refunded_at: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'refund_amount' })
  refund_amount: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id', referencedColumnName: 'id' })
  order: Order;
}

