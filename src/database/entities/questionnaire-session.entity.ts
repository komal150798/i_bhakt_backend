import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('questionnaire_sessions')
export class QuestionnaireSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  @Index()
  user_id: number;

  @ManyToOne(() => User, (user) => user.questionnaire_sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: false, default: 1 })
  version: number;

  @Column({ type: 'int', nullable: true })
  age_at_assessment: number;

  @Column({ type: 'text', nullable: false })
  responses: string; // JSON string

  @Column({ type: 'float', nullable: false })
  aggregate_score: number;

  @Column({ type: 'float', nullable: false })
  baseline_score: number;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'questionnaire' })
  source: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date;
}







