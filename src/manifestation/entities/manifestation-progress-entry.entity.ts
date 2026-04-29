import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Manifestation } from './manifestation.entity';

@Entity('manifestation_progress_entries')
@Index(['manifestation_id', 'entry_date', 'is_deleted'], { unique: true })
@Index(['manifestation_id', 'is_deleted'])
@Index(['user_id', 'is_deleted'])
export class ManifestationProgressEntry extends BaseEntity {
  @Column({ type: 'bigint', name: 'manifestation_id' })
  manifestation_id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'date', name: 'entry_date' })
  entry_date: Date;

  @Column({ type: 'text', name: 'action_text' })
  action_text: string;

  @ManyToOne(() => Manifestation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifestation_id', referencedColumnName: 'id' })
  manifestation: Manifestation;
}
