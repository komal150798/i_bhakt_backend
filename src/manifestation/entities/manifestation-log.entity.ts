import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('manifestation_logs')
@Index(['user_id', 'is_deleted'])
export class ManifestationLog extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'text' })
  desire_text: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'emotional_coherence' })
  emotional_coherence: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'linguistic_clarity' })
  linguistic_clarity: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'astrological_resonance' })
  astrological_resonance: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'manifestation_probability' })
  manifestation_probability: number | null;

  @Column({ type: 'date', nullable: true, name: 'best_manifestation_date' })
  best_manifestation_date: Date | null;

  @Column({ type: 'jsonb', nullable: true, name: 'analysis_data' })
  analysis_data: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}







