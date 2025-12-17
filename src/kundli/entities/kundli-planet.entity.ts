import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Kundli } from './kundli.entity';

@Entity('kundli_planets')
@Index(['kundli_id', 'planet_name'])
export class KundliPlanet extends BaseEntity {
  @Column({ type: 'bigint', name: 'kundli_id' })
  kundli_id: number;

  @Column({ type: 'varchar', length: 50, name: 'planet_name' })
  planet_name: string;

  @Column({ type: 'decimal', precision: 12, scale: 8, name: 'longitude_degrees' })
  longitude_degrees: number;

  @Column({ type: 'smallint', name: 'sign_number' })
  sign_number: number;

  @Column({ type: 'varchar', length: 50, name: 'sign_name' })
  sign_name: string;

  @Column({ type: 'smallint', name: 'house_number' })
  house_number: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nakshatra' })
  nakshatra: string | null;

  @Column({ type: 'smallint', nullable: true })
  pada: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_retrograde' })
  is_retrograde: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 8, nullable: true, name: 'speed' })
  speed: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => Kundli, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kundli_id', referencedColumnName: 'id' })
  kundli: Kundli;
}







