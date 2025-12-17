import { Entity, Column, Index } from 'typeorm';

/**
 * Central Constants Entity
 * Stores all keywords, words, sentences, and constants used across the application
 * This ensures NO hardcoded words in any API - everything comes from database
 */
@Entity('app_constants')
@Index(['key'], { unique: true })
@Index(['category'])
@Index(['is_active'])
export class AppConstant {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text', unique: true })
  key: string; // e.g., 'manifestation.positive_words', 'karma.good_actions'

  @Column({ type: 'text' })
  category: string; // e.g., 'manifestation', 'karma', 'common', 'energy_states'

  @Column({ type: 'text' })
  name: string; // Human-readable name, e.g., 'Positive Manifestation Words'

  @Column({ type: 'jsonb' })
  value: string[] | Record<string, any>; // Array of words or object structure

  @Column({ type: 'text', nullable: true })
  description: string | null; // Description of what this constant is used for

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;
}

