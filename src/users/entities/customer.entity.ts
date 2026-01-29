import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PlanType } from '../../common/enums/plan-type.enum';
// TODO: Uncomment after migrating entities to use Customer
// import { Subscription } from '../../subscriptions/entities/subscription.entity';
// import { Order } from '../../orders/entities/order.entity';
// import { Kundli } from '../../kundli/entities/kundli.entity';
// import { KarmaEntry } from '../../karma/entities/karma-entry.entity';
// import { ManifestationLog } from '../../manifestation/entities/manifestation-log.entity';
import { CustomerToken } from '../../auth/entities/customer-token.entity';

/**
 * Customer Entity (cst_customer)
 * For frontend customer authentication and profile
 */
@Entity('cst_customer')
@Index(['phone_number', 'is_deleted'], { unique: true })
@Index(['email', 'is_deleted'], { unique: true })
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  phone_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null; // Hashed with bcrypt (nullable for OTP-only users)

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'google_id' })
  google_id: string | null; // Google user ID for Google login

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

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'last_login_ip' })
  last_login_ip: string | null;

  // Relations
  // TODO: Uncomment after migrating Subscription, Order, Kundli, KarmaEntry, ManifestationLog to use Customer
  // @OneToMany(() => Subscription, (subscription) => subscription.customer)
  // subscriptions: Subscription[];

  // @OneToMany(() => Order, (order) => order.customer)
  // orders: Order[];

  // @OneToMany(() => Kundli, (kundli) => kundli.customer)
  // kundlis: Kundli[];

  // @OneToMany(() => KarmaEntry, (karma) => karma.customer)
  // karma_entries: KarmaEntry[];

  // @OneToMany(() => ManifestationLog, (manifestation) => manifestation.customer)
  // manifestation_logs: ManifestationLog[];

  @OneToMany(() => CustomerToken, (token) => token.customer)
  tokens: CustomerToken[];
}

