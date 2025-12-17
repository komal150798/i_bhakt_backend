import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Payment } from '../../payments/entities/payment.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('orders')
@Index(['user_id', 'order_status', 'is_deleted'])
export class Order extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  order_number: string;

  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING, name: 'order_status' })
  order_status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount' })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax' })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  total_amount: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  items: Record<string, any>[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completed_at: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => Subscription, (subscription) => subscription.order)
  subscriptions: Subscription[];
}

