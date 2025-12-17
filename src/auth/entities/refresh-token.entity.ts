import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Index(['user_id', 'is_revoked'])
@Index(['token', 'is_revoked'])
export class RefreshToken extends BaseEntity {
  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  user_id: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'admin_id' })
  admin_id: number | null;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expires_at: Date;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  is_revoked: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User | null;
}







