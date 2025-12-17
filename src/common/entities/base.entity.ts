import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/entities/user.entity';

/**
 * BaseEntity - All tables must extend this
 * Includes global fields: unique_id, added_date, modify_date, is_enabled, is_deleted, added_by, modify_by
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  @Index()
  unique_id: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'added_date' })
  added_date: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'modify_date', onUpdate: 'CURRENT_TIMESTAMP' })
  modify_date: Date;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  is_enabled: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  @Index()
  is_deleted: boolean;

  @Column({ type: 'bigint', nullable: true, name: 'added_by' })
  added_by: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'modify_by' })
  modify_by: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'added_by', referencedColumnName: 'id' })
  addedByUser: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'modify_by', referencedColumnName: 'id' })
  modifiedByUser: User | null;

  @BeforeInsert()
  generateUniqueId() {
    if (!this.unique_id) {
      this.unique_id = uuidv4();
    }
  }

  @BeforeUpdate()
  updateModifyDate() {
    this.modify_date = new Date();
  }
}

