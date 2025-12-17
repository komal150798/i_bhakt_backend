import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('nakshatra_master')
@Index(['nakshatra_name', 'is_enabled'])
export class NakshatraMaster extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'nakshatra_name' })
  nakshatra_name: string;

  @Column({ type: 'smallint', name: 'nakshatra_number' })
  nakshatra_number: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true, name: 'start_degrees' })
  start_degrees: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true, name: 'end_degrees' })
  end_degrees: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ruler_planet' })
  ruler_planet: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}







