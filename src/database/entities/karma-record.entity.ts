import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { KarmaCategory } from './karma-category.entity';

@Entity('karma_records')
export class KarmaRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User, (user) => user.karma_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @ManyToOne(() => KarmaCategory, (category) => category.karma_records, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: KarmaCategory;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'text' })
  source: string; // text | voice | system

  @Column({ type: 'text', nullable: true })
  input_text: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  media_path: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  sentiment: string;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ type: 'float', nullable: false, default: 0.0 })
  score_delta: number;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'recorded' })
  status: string; // recorded | pending | completed | skipped | not_implemented

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  recorded_at: Date;

  @Column({ type: 'text', nullable: true, name: 'extra_metadata' })
  extra_metadata: string;
}







