import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DashaRecord } from './dasha-record.entity';
import { UserSubscription } from './user-subscription.entity';
import { KarmaRecord } from './karma-record.entity';
import { UserKarmaScore } from './user-karma-score.entity';
import { DailyGuidanceLog } from './daily-guidance-log.entity';
import { QuestionnaireSession } from './questionnaire-session.entity';
import { DailyAlignmentTip } from './daily-alignment-tip.entity';
import { Referral } from './referral.entity';
import { PendingReferral } from './pending-referral.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string;

  // Birth details
  @Column({ type: 'varchar', length: 10, nullable: false })
  date_of_birth: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 5, nullable: false })
  time_of_birth: string; // HH:MM

  @Column({ type: 'varchar', length: 200, nullable: false })
  place_name: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  questionnaire_completed: boolean;

  @Column({ type: 'datetime', nullable: true })
  questionnaire_last_completed_at: Date;

  // Plan and referral
  @Column({ type: 'varchar', length: 30, nullable: false, default: 'awaken' })
  plan: string; // awaken, karma_builder, karma_pro, dharma_master

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  referral_code: string;

  @Column({ type: 'int', nullable: true })
  referred_by_id: number;

  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: 'referred_by_id' })
  referred_by: User;

  // Astrological data at birth
  @Column({ type: 'varchar', length: 50, nullable: false })
  nakshatra: string;

  @Column({ type: 'int', nullable: false })
  pada: number;

  @Column({ type: 'float', nullable: false })
  moon_longitude_deg: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  dasha_at_birth: string;

  // Timestamps
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => DashaRecord, (dasha) => dasha.user, { cascade: true })
  dasha_records: DashaRecord[];

  @OneToMany(() => UserSubscription, (subscription) => subscription.user, { cascade: true })
  subscriptions: UserSubscription[];

  @OneToMany(() => KarmaRecord, (karma) => karma.user, { cascade: true })
  karma_records: KarmaRecord[];

  @OneToMany(() => UserKarmaScore, (score) => score.user, { cascade: true })
  karma_scores: UserKarmaScore[];

  karma_score: UserKarmaScore; // Virtual property for convenience

  @OneToMany(() => DailyGuidanceLog, (log) => log.user, { cascade: true })
  guidance_logs: DailyGuidanceLog[];

  @OneToMany(() => QuestionnaireSession, (session) => session.user, { cascade: true })
  questionnaire_sessions: QuestionnaireSession[];

  @OneToMany(() => DailyAlignmentTip, (tip) => tip.user, { cascade: true })
  alignment_tips: DailyAlignmentTip[];

  @OneToMany(() => Referral, (referral) => referral.referrer, { cascade: true })
  referrals: Referral[];
}

