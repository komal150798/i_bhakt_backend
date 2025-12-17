import { Entity, Column, Index } from 'typeorm';

@Entity('ai_prompts')
@Index(['key'], { unique: true })
@Index(['scope'])
@Index(['type'])
@Index(['is_active'])
export class AIPrompt {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text', unique: true })
  key: string; // e.g., 'karma.classification.system', 'manifestation.analysis.user'

  @Column({ type: 'text' })
  scope: string; // e.g., 'karma', 'manifestation', 'user_profile', 'admin'

  @Column({ type: 'text', nullable: true, name: 'model_hint' })
  model_hint: string | null; // e.g., 'gpt-4.1', 'gemini-pro', 'claude-3.7-sonnet'

  @Column({ type: 'text' })
  type: string; // 'system', 'user', 'tool', 'instruction'

  @Column({ type: 'text', default: 'en' })
  language: string;

  @Column({ type: 'text' })
  template: string; // The actual prompt text with placeholders like {{user_name}}

  @Column({ type: 'text', nullable: true })
  description: string | null; // For admin UI to know what this prompt does

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updated_by: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;
}
