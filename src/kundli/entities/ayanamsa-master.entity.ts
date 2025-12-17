import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('ayanamsa_master')
@Index(['ayanamsa_name', 'is_enabled'])
export class AyanamsaMaster extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'ayanamsa_name' })
  ayanamsa_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'display_name' })
  display_name: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'default_value' })
  default_value: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  is_default: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}







