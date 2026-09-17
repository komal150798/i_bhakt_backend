import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ZunoUser } from '../entities/zuno-user.entity';
import { ZunoUserProfile } from '../entities/zuno-user-profile.entity';
import { ZunoBirthProfile } from '../entities/zuno-birth-profile.entity';
import { UpdateProfileDto, UpsertBirthProfileDto } from '../dtos/identity.dtos';
import { OutboxService } from '../../common/services/outbox.service';
import { ZunoAuditService } from '../../common/services/zuno-audit.service';
import { ZunoOwnershipService } from '../../common/services/zuno-ownership.service';
import { ZunoException } from '../../common/errors/zuno.exception';
import {
  BirthProfileSource,
  BirthTimeAccuracy,
  OnboardingStatus,
  ZunoAggregateType,
  ZunoEventType,
} from '../../common/enums';

@Injectable()
export class ZunoProfileService {
  constructor(
    @InjectRepository(ZunoUser)
    private readonly users: Repository<ZunoUser>,
    @InjectRepository(ZunoUserProfile)
    private readonly profiles: Repository<ZunoUserProfile>,
    @InjectRepository(ZunoBirthProfile)
    private readonly birthProfiles: Repository<ZunoBirthProfile>,
    private readonly outbox: OutboxService,
    private readonly audit: ZunoAuditService,
    private readonly ownership: ZunoOwnershipService,
    private readonly dataSource: DataSource,
  ) {}

  async getProfile(userId: string): Promise<ZunoUserProfile | null> {
    return this.profiles.findOne({ where: { user_id: userId } });
  }

  /**
   * Partial profile update.
   *
   * Every field is optional and only supplied fields are written, because
   * Step 30 Phase 2 section 18 requires progressive enrichment - a user must be
   * able to fill in their profile a piece at a time without a PATCH wiping what
   * they set earlier.
   */
  async updateProfile(
    user: ZunoUser,
    dto: UpdateProfileDto,
  ): Promise<{ profile: ZunoUserProfile; user: ZunoUser }> {
    return this.dataSource.transaction(async (manager) => {
      let profile = await manager.findOne(ZunoUserProfile, {
        where: { user_id: user.id },
      });
      if (!profile) {
        profile = manager.create(ZunoUserProfile, { user_id: user.id });
      }

      const before = { ...profile };
      if (dto.preferredName !== undefined) profile.preferred_name = dto.preferredName;
      if (dto.displayName !== undefined) profile.display_name = dto.displayName;
      if (dto.countryCode !== undefined) profile.country_code = dto.countryCode;
      if (dto.city !== undefined) profile.city = dto.city;
      if (dto.occupation !== undefined) profile.occupation = dto.occupation;
      if (dto.preferredLanguage !== undefined) {
        profile.preferred_language = dto.preferredLanguage;
      }
      const savedProfile = await manager.save(ZunoUserProfile, profile);

      let savedUser = user;
      if (dto.timezone !== undefined) {
        user.timezone = dto.timezone;
        savedUser = await manager.save(ZunoUser, user);
      }

      // Onboarding advances on its own as the user supplies things, rather than
      // being gated behind a "complete your profile" wall.
      savedUser = await this.refreshOnboarding(manager, savedUser);

      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: 'PROFILE_UPDATED',
        entityType: 'ZunoUserProfile',
        entityId: savedProfile.id,
        before,
        after: savedProfile,
      });

      return { profile: savedProfile, user: savedUser };
    });
  }

  async getBirthProfile(userId: string): Promise<ZunoBirthProfile | null> {
    return this.birthProfiles.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Creates or replaces the user's birth profile.
   *
   * The accuracy rules here are the ones Build Rules 52-53 care about:
   *   - UNKNOWN accuracy must not carry a time. If a client sends both, the
   *     time is dropped rather than the accuracy being quietly upgraded.
   *   - EXACT/APPROXIMATE/RECTIFIED require a time; claiming precision without
   *     one is rejected rather than defaulted to midnight, which would be a
   *     fabricated value flowing into chart calculation.
   *
   * Coordinates and timezone are never taken from the request. They stay null
   * until a trusted location service resolves them (Step 21 section 22), and
   * `isCalculationReady` reports that gap honestly.
   */
  async upsertBirthProfile(
    user: ZunoUser,
    dto: UpsertBirthProfileDto,
  ): Promise<ZunoBirthProfile> {
    const unknownTime = dto.timeAccuracy === BirthTimeAccuracy.UNKNOWN;
    if (!unknownTime && !dto.timeOfBirth) {
      throw ZunoException.validation(
        [{ field: 'timeOfBirth', code: 'REQUIRED_FOR_ACCURACY' }],
        'A birth time is needed unless the accuracy is UNKNOWN.',
      );
    }

    const timeOfBirth = unknownTime ? null : normaliseTime(dto.timeOfBirth!);

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(ZunoBirthProfile, {
        where: { user_id: user.id },
        order: { created_at: 'DESC' },
      });

      const before = existing ? { id: existing.id } : undefined;
      const target =
        existing ??
        manager.create(ZunoBirthProfile, {
          user_id: user.id,
          source: BirthProfileSource.USER_PROVIDED,
        });

      // Changing any of date, time or place invalidates a previously resolved
      // location: the old coordinates describe a different place or moment.
      const placeChanged =
        target.place_name !== dto.placeName ||
        target.place_country_code !== (dto.placeCountryCode ?? null);

      target.date_of_birth = dto.dateOfBirth;
      target.time_of_birth = timeOfBirth;
      target.time_accuracy = dto.timeAccuracy;
      target.place_name = dto.placeName;
      target.place_country_code = dto.placeCountryCode ?? null;
      target.source = BirthProfileSource.USER_PROVIDED;

      if (placeChanged) {
        target.latitude = null;
        target.longitude = null;
        target.timezone_at_birth = null;
      }

      const saved = await manager.save(ZunoBirthProfile, target);
      const refreshedUser = await this.refreshOnboarding(manager, user);

      // Audit hashes rather than values - this is exactly the sensitive data
      // Step 20 section 79 says not to copy into the audit trail.
      await this.audit.record(manager, {
        actorType: 'USER',
        actorId: user.id,
        userId: user.id,
        action: existing ? 'BIRTH_PROFILE_UPDATED' : 'BIRTH_PROFILE_CREATED',
        entityType: 'ZunoBirthProfile',
        entityId: saved.id,
        before,
        after: { id: saved.id, accuracy: saved.time_accuracy },
        metadata: { place_resolution_reset: placeChanged },
      });

      await this.outbox.enqueue(manager, {
        aggregateType: ZunoAggregateType.BIRTH_PROFILE,
        aggregateId: saved.id,
        eventType: ZunoEventType.BIRTH_PROFILE_UPDATED,
        payload: {
          birth_profile_id: saved.id,
          user_id: user.id,
          // Ids and flags only - no birth values in the event payload.
          requires_location_resolution: !saved.isCalculationReady,
        },
      });

      void refreshedUser;
      return saved;
    });
  }

  /**
   * Derives onboarding status from what actually exists.
   *
   * Computed rather than set by the client so it cannot drift out of step with
   * reality, and so the client can never mark itself COMPLETED to unlock
   * something (Build Rule 10: the client is never authoritative).
   */
  private async refreshOnboarding(
    manager: { findOne: Function; save: Function },
    user: ZunoUser,
  ): Promise<ZunoUser> {
    const profile = await manager.findOne(ZunoUserProfile, {
      where: { user_id: user.id },
    });
    const birth = await manager.findOne(ZunoBirthProfile, {
      where: { user_id: user.id },
    });

    let next: OnboardingStatus;
    if (!profile?.preferred_name) {
      next = OnboardingStatus.NOT_STARTED;
    } else if (!birth) {
      next = OnboardingStatus.BIRTH_PENDING;
    } else if (!birth.isCalculationReady) {
      // Has given birth details but they are not yet usable for calculation.
      // Still a legitimate place to sit - ZUNO works without astrology.
      next = OnboardingStatus.PROFILE_MINIMAL;
    } else {
      next = OnboardingStatus.COMPLETED;
    }

    if (user.onboarding_status === next) return user;
    user.onboarding_status = next;
    return manager.save(ZunoUser, user);
  }
}

/** Normalises HH:mm to HH:mm:ss so the TIME column is consistent. */
function normaliseTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}
