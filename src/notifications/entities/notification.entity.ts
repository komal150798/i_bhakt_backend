import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
@Index(['user_id', 'is_read', 'is_deleted'])
@Index(['user_id', 'added_date'])
export class Notification extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  user_id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'type' })
  type: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'action_url' })
  action_url: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  read_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}

