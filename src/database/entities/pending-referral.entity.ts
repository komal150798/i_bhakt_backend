import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('pending_referrals')
export class PendingReferral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  @Index()
  referrer_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column({ type: 'varchar', length: 10, nullable: false })
  referral_type: string; // 'email' or 'phone'

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Index()
  referral_value: string; // email address or phone number

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  status: string; // 'pending', 'completed', 'expired'

  @Column({ type: 'int', nullable: true })
  @Index()
  referred_user_id: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'referred_user_id' })
  referred_user: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;
}







