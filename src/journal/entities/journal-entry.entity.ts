import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('journal_entries')
@Index(['user_id', 'entry_date'])
@Index(['user_id', 'is_deleted'])
export class JournalEntry extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'date', name: 'entry_date' })
  entry_date: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'entry_type' })
  entry_type: string | null; // 'gratitude', 'reflection', 'goal', 'general', etc.

  @Column({ type: 'jsonb', nullable: true, name: 'sentiment_analysis' })
  sentiment_analysis: {
    sentiment: string; // 'positive', 'neutral', 'negative'
    score: number; // 0-1
    emotions?: string[];
  } | null;

  @Column({ type: 'jsonb', nullable: true, name: 'nlp_analysis' })
  nlp_analysis: {
    keywords?: string[];
    topics?: string[];
    summary?: string;
  } | null;

  @Column({ type: 'bigint', nullable: true, name: 'karma_entry_id' })
  karma_entry_id: number | null; // Link to karma entry if applicable

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}



