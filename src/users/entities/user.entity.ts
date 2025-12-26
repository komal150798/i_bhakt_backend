import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { PlanType } from '../../common/enums/plan-type.enum';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Order } from '../../orders/entities/order.entity';
import { Kundli } from '../../kundli/entities/kundli.entity';
// KarmaEntry now uses Customer entity, not User
// import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import { DashaRecord } from '../../database/entities/dasha-record.entity';

@Entity('users')
@Index(['phone_number', 'is_deleted'])
@Index(['email', 'is_deleted'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  phone_number: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'time', nullable: true })
  time_of_birth: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  place_name: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nakshatra: string | null;

  @Column({ type: 'smallint', nullable: true })
  pada: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 8, nullable: true })
  moon_longitude_deg: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dasha_at_birth: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: PlanType, default: PlanType.FREE, name: 'current_plan' })
  current_plan: PlanType;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  referral_code: string | null;

  @Column({ type: 'bigint', nullable: true })
  referred_by: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  last_login: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Kundli, (kundli) => kundli.user)
  kundlis: Kundli[];

  // KarmaEntry now uses Customer entity, not User
  // @OneToMany(() => KarmaEntry, (karma) => karma.user)
  // karma_entries: KarmaEntry[];

  @OneToMany(() => ManifestationLog, (manifestation) => manifestation.user)
  manifestation_logs: ManifestationLog[];

  @OneToMany(() => DashaRecord, (dasha) => dasha.user, { cascade: true })
  dasha_records: DashaRecord[];
}

