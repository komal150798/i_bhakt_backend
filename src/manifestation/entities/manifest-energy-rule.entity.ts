import { Entity, Column, Index } from 'typeorm';

@Entity('manifest_energy_rules')
@Index(['energy_state'])
export class ManifestEnergyRule {
  @Column({ type: 'uuid', primary: true, default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'text', name: 'energy_state' })
  energy_state: string; // aligned, blocked, doubtful, scattered, burned_out

  @Column({ type: 'text' })
  pattern: string; // keyword or regex

  @Column({ type: 'integer', default: 1 })
  weight: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()', name: 'created_at' })
  created_at: Date;
}
