import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Kundli } from './kundli.entity';

@Entity('kundli_houses')
@Index(['kundli_id', 'house_number'])
export class KundliHouse extends BaseEntity {
  @Column({ type: 'bigint', name: 'kundli_id' })
  kundli_id: number;

  @Column({ type: 'smallint', name: 'house_number' })
  house_number: number;

  @Column({ type: 'decimal', precision: 12, scale: 8, name: 'cusp_degrees' })
  cusp_degrees: number;

  @Column({ type: 'varchar', length: 50, name: 'sign_name' })
  sign_name: string;

  @Column({ type: 'smallint', name: 'sign_number' })
  sign_number: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => Kundli, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kundli_id', referencedColumnName: 'id' })
  kundli: Kundli;
}

