import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AntardashaRecord } from './antardasha-record.entity';

@Entity('dasha_records')
export class DashaRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User, (user) => user.dasha_records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, nullable: false })
  mahadasha_lord: string;

  @Column({ type: 'datetime', nullable: false })
  start_date: Date;

  @Column({ type: 'datetime', nullable: false })
  end_date: Date;

  @Column({ type: 'float', nullable: false })
  duration_years: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => AntardashaRecord, (antara) => antara.dasha_record, { cascade: true })
  antardashas: AntardashaRecord[];
}







