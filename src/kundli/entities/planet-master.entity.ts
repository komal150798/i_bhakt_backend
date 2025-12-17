import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('planet_master')
@Index(['planet_name', 'is_enabled'])
export class PlanetMaster extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'planet_name' })
  planet_name: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'symbol' })
  symbol: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}







