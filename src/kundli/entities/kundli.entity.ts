import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Customer } from '../../users/entities/customer.entity';
import { KundliPlanet } from './kundli-planet.entity';
import { KundliHouse } from './kundli-house.entity';

@Entity('kundli')
@Index(['user_id', 'is_deleted'])
export class Kundli extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number; // Note: Still named user_id for backward compatibility, but references cst_customer.id

  @Column({ type: 'date', name: 'birth_date' })
  birth_date: Date;

  @Column({ type: 'time', name: 'birth_time' })
  birth_time: string;

  @Column({ type: 'varchar', length: 255, name: 'birth_place' })
  birth_place: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 100 })
  timezone: string;

  @Column({ type: 'decimal', precision: 12, scale: 8, nullable: true, name: 'lagna_degrees' })
  lagna_degrees: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'lagna_name' })
  lagna_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'nakshatra' })
  nakshatra: string | null;

  @Column({ type: 'smallint', nullable: true })
  pada: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'tithi' })
  tithi: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'yoga' })
  yoga: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'karana' })
  karana: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'ayanamsa' })
  ayanamsa: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'full_data' })
  full_data: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'dasha_timeline' })
  dasha_timeline: Record<string, any>[] | null;

  @Column({ type: 'jsonb', nullable: true, name: 'navamsa_data' })
  navamsa_data: Record<string, any> | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  customer: Customer;

  @OneToMany(() => KundliPlanet, (planet) => planet.kundli, { cascade: true })
  planets: KundliPlanet[];

  @OneToMany(() => KundliHouse, (house) => house.kundli, { cascade: true })
  houses: KundliHouse[];
}







