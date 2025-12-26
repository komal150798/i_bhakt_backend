import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PratyantarDashaRecord } from './pratyantar-dasha-record.entity';

@Entity('sukshma_dasha_records')
export class SukshmaDashaRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  pratyantar_dasha_record_id: number;

  @ManyToOne(() => PratyantarDashaRecord, (pratyantar) => pratyantar.sukshmadashas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pratyantar_dasha_record_id' })
  pratyantar_dasha_record: PratyantarDashaRecord;

  @Column({ type: 'varchar', length: 20, nullable: false })
  sukshma_lord: string;

  @Column({ type: 'timestamp', nullable: false })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: false })
  end_date: Date;

  @Column({ type: 'float', nullable: false })
  duration_years: number;

  @CreateDateColumn()
  created_at: Date;
}







