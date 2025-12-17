import { Entity, Column, Index } from 'typeorm';

@Entity('manifest_user_logs')
@Index(['user_id'])
@Index(['detected_category'])
@Index(['created_at'])
export class ManifestUserLog {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @Column({ type: 'text', name: 'manifestation_title' })
  manifestation_title: string;

  @Column({ type: 'text', name: 'manifestation_text' })
  manifestation_text: string;

  @Column({ type: 'text', name: 'detected_category' })
  detected_category: string;

  @Column({ type: 'text', nullable: true, name: 'detected_subcategory' })
  detected_subcategory: string | null;

  @Column({ type: 'text', name: 'energy_state' })
  energy_state: string;

  @Column({ type: 'jsonb', name: 'ai_output_json' })
  ai_output_json: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;
}
