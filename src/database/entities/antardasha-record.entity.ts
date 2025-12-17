import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DashaRecord } from './dasha-record.entity';
import { PratyantarDashaRecord } from './pratyantar-dasha-record.entity';

@Entity('antardasha_records')
export class AntardashaRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  dasha_record_id: number;

  @ManyToOne(() => DashaRecord, (dasha) => dasha.antardashas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dasha_record_id' })
  dasha_record: DashaRecord;

  @Column({ type: 'varchar', length: 20, nullable: false })
  antardasha_lord: string;

  @Column({ type: 'datetime', nullable: false })
  start_date: Date;

  @Column({ type: 'datetime', nullable: false })
  end_date: Date;

  @Column({ type: 'float', nullable: false })
  duration_years: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => PratyantarDashaRecord, (pratyantar) => pratyantar.antardasha_record, { cascade: true })
  pratyantardashas: PratyantarDashaRecord[];
}







