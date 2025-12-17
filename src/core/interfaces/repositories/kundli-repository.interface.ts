import { Kundli } from '../../../kundli/entities/kundli.entity';

export interface CreateKundliInput {
  user_id: number;
  birth_date: Date;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  lagna_degrees?: number | null;
  lagna_name?: string | null;
  nakshatra?: string | null;
  pada?: number | null;
  tithi?: string | null;
  yoga?: string | null;
  karana?: string | null;
  ayanamsa?: number | null;
  full_data?: Record<string, any> | null;
  dasha_timeline?: Record<string, any>[] | null;
  navamsa_data?: Record<string, any> | null;
}

export interface UpdateKundliInput {
  birth_date?: Date;
  birth_time?: string;
  birth_place?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  lagna_degrees?: number | null;
  lagna_name?: string | null;
  nakshatra?: string | null;
  pada?: number | null;
  tithi?: string | null;
  yoga?: string | null;
  karana?: string | null;
  ayanamsa?: number | null;
  full_data?: Record<string, any> | null;
  dasha_timeline?: Record<string, any>[] | null;
  navamsa_data?: Record<string, any> | null;
}

export interface IKundliRepository {
  findById(id: number): Promise<Kundli | null>;
  findByUniqueId(uniqueId: string): Promise<Kundli | null>;
  findByUserId(userId: number, options?: { is_deleted?: boolean }): Promise<Kundli[]>;
  findOneByUserId(userId: number, options?: { is_deleted?: boolean }): Promise<Kundli | null>;
  create(data: CreateKundliInput): Promise<Kundli>;
  update(kundli: Kundli, data: UpdateKundliInput): Promise<Kundli>;
  delete(kundli: Kundli): Promise<void>;
}

