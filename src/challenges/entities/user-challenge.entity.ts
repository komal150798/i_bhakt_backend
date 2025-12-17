import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Challenge } from './challenge.entity';

@Entity('user_challenges')
@Index(['user_id', 'challenge_id'])
@Index(['user_id', 'status'])
export class UserChallenge extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'bigint', name: 'challenge_id' })
  challenge_id: number;

  @Column({ type: 'date', name: 'start_date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  end_date: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // 'active', 'completed', 'abandoned'

  @Column({ type: 'int', default: 0, name: 'current_day' })
  current_day: number;

  @Column({ type: 'jsonb', nullable: true, name: 'completed_days' })
  completed_days: number[] | null; // Array of day numbers that are completed

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challenge_id', referencedColumnName: 'id' })
  challenge: Challenge;
}



