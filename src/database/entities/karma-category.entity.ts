import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { KarmaRecord } from './karma-record.entity';

@Entity('karma_categories')
export class KarmaCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80, unique: true, nullable: false })
  slug: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 16, nullable: false, default: 'neutral' })
  polarity: string; // positive | negative | neutral

  @Column({ type: 'float', nullable: false, default: 0.0 })
  default_weight: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => KarmaRecord, (record) => record.category)
  karma_records: KarmaRecord[];
}







