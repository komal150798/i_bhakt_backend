import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('manifestations')
@Index(['user_id', 'is_archived'])
@Index(['user_id', 'is_deleted'])
export class Manifestation extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null; // relationship / career / money / health / spiritual

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'emotional_state' })
  emotional_state: string | null;

  @Column({ type: 'date', nullable: true, name: 'target_date' })
  target_date: Date | null;

  // AI computed fields
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'resonance_score' })
  resonance_score: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'alignment_score' })
  alignment_score: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'antrashaakti_score' })
  antrashaakti_score: number | null; // Inner Power

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'mahaadha_score' })
  mahaadha_score: number | null; // Blockage Score

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'astro_support_index' })
  astro_support_index: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'mfp_score' })
  mfp_score: number | null; // Manifestation Fulfillment Probability

  @Column({ type: 'jsonb', nullable: true })
  tips: {
    rituals?: string[];
    what_to_manifest?: string[];
    what_not_to_manifest?: string[];
    thought_alignment?: string[];
    daily_actions?: string[];
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  insights: {
    ai_narrative?: string;
    astro_insights?: string;
    energy_state?: 'aligned' | 'unstable' | 'blocked';
    keyword_analysis?: Record<string, any>;
    emotional_charge?: string;
    category_label?: string;
    summary_for_ui?: string;
    energy_reason?: string;
  } | null;

  @Column({ type: 'boolean', default: false, name: 'is_archived' })
  is_archived: boolean;

  // Note: user_id can reference either users or cst_customer table
  // Foreign key constraint removed to support both tables
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  // user: User;
}

