import { Entity, Column, Index } from 'typeorm';

@Entity('manifest_backend_cache')
export class ManifestBackendCache {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'jsonb', name: 'config_json' })
  config_json: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()', name: 'updated_at' })
  updated_at: Date;
}
