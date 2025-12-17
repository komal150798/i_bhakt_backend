import { ManifestationLog } from '../../../manifestation/entities/manifestation-log.entity';

export interface CreateManifestationLogInput {
  user_id: number;
  desire_text: string;
  emotional_coherence?: number | null;
  linguistic_clarity?: number | null;
  astrological_resonance?: number | null;
  manifestation_probability?: number | null;
  best_manifestation_date?: Date | null;
  analysis_data?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateManifestationLogInput {
  desire_text?: string;
  emotional_coherence?: number | null;
  linguistic_clarity?: number | null;
  astrological_resonance?: number | null;
  manifestation_probability?: number | null;
  best_manifestation_date?: Date | null;
  analysis_data?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface IManifestationRepository {
  findById(id: number): Promise<ManifestationLog | null>;
  findByUniqueId(uniqueId: string): Promise<ManifestationLog | null>;
  findByUserId(userId: number): Promise<ManifestationLog[]>;
  findAll(options?: { is_deleted?: boolean }): Promise<ManifestationLog[]>;
  create(data: CreateManifestationLogInput): Promise<ManifestationLog>;
  update(manifestationLog: ManifestationLog, data: UpdateManifestationLogInput): Promise<ManifestationLog>;
  delete(manifestationLog: ManifestationLog): Promise<void>;
}

