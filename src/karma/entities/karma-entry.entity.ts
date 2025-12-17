import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
import { KarmaType } from '../../common/enums/karma-type.enum';

@Entity('karma_entries')
@Index(['user_id', 'karma_type', 'is_deleted'])
@Index(['user_id', 'entry_date'])
export class KarmaEntry extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: KarmaType, name: 'karma_type' })
  karma_type: KarmaType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'score' })
  score: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'category_slug' })
  category_slug: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'category_name' })
  category_name: string | null;

  @Column({ type: 'enum', enum: ['good', 'bad', 'neutral'], nullable: true, name: 'self_assessment' })
  self_assessment: 'good' | 'bad' | 'neutral' | null;

  @Column({ type: 'date', name: 'entry_date', default: () => 'CURRENT_DATE' })
  entry_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  ai_analysis: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  customer: Customer;
}


