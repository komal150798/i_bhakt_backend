import { KarmaEntry } from '../../../karma/entities/karma-entry.entity';
import { KarmaType } from '../../../common/enums/karma-type.enum';

export interface CreateKarmaEntryInput {
  user_id: number;
  text: string;
  karma_type: KarmaType;
  score?: number;
  category_slug?: string | null;
  category_name?: string | null;
  self_assessment?: 'good' | 'bad' | 'neutral' | null;
  entry_date?: Date;
  ai_analysis?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateKarmaEntryInput {
  text?: string;
  karma_type?: KarmaType;
  score?: number;
  category_slug?: string | null;
  category_name?: string | null;
  self_assessment?: 'good' | 'bad' | 'neutral' | null;
  entry_date?: Date;
  ai_analysis?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface IKarmaRepository {
  findById(id: number): Promise<KarmaEntry | null>;
  findByUniqueId(uniqueId: string): Promise<KarmaEntry | null>;
  findByUserId(userId: number, options?: { karma_type?: string }): Promise<KarmaEntry[]>;
  findByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<KarmaEntry[]>;
  findAll(options?: { karma_type?: string; is_deleted?: boolean }): Promise<KarmaEntry[]>;
  create(data: CreateKarmaEntryInput): Promise<KarmaEntry>;
  update(karmaEntry: KarmaEntry, data: UpdateKarmaEntryInput): Promise<KarmaEntry>;
  delete(karmaEntry: KarmaEntry): Promise<void>;
}

