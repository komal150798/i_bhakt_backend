import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AntardashaRecord } from './antardasha-record.entity';
import { SukshmaDashaRecord } from './sukshma-dasha-record.entity';

@Entity('pratyantar_dasha_records')
export class PratyantarDashaRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  antardasha_record_id: number;

  @ManyToOne(() => AntardashaRecord, (antara) => antara.pratyantardashas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antardasha_record_id' })
  antardasha_record: AntardashaRecord;

  @Column({ type: 'varchar', length: 20, nullable: false })
  pratyantar_lord: string;

  @Column({ type: 'datetime', nullable: false })
  start_date: Date;

  @Column({ type: 'datetime', nullable: false })
  end_date: Date;

  @Column({ type: 'float', nullable: false })
  duration_years: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => SukshmaDashaRecord, (sukshma) => sukshma.pratyantar_dasha_record, { cascade: true })
  sukshmadashas: SukshmaDashaRecord[];
}







