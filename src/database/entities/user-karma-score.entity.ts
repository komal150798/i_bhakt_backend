import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_karma_scores')
export class UserKarmaScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true, nullable: false })
  user_id: number;

  @OneToOne(() => User, (user) => user.karma_score, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'float', nullable: false, default: 0.0 })
  cumulative_score: number; // 0-100

  @Column({ type: 'float', nullable: false, default: 0.0 })
  positive_score: number;

  @Column({ type: 'float', nullable: false, default: 0.0 })
  negative_score: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  last_recalculated_at: Date;

  @Column({ type: 'text', nullable: true })
  observations: string;
}







