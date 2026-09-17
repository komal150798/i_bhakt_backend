"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_user_entity_1 = require("../entities/zuno-user.entity");
const zuno_user_profile_entity_1 = require("../entities/zuno-user-profile.entity");
const zuno_birth_profile_entity_1 = require("../entities/zuno-birth-profile.entity");
const outbox_service_1 = require("../../common/services/outbox.service");
const zuno_audit_service_1 = require("../../common/services/zuno-audit.service");
const zuno_ownership_service_1 = require("../../common/services/zuno-ownership.service");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const enums_1 = require("../../common/enums");
let ZunoProfileService = class ZunoProfileService {
    constructor(users, profiles, birthProfiles, outbox, audit, ownership, dataSource) {
        this.users = users;
        this.profiles = profiles;
        this.birthProfiles = birthProfiles;
        this.outbox = outbox;
        this.audit = audit;
        this.ownership = ownership;
        this.dataSource = dataSource;
    }
    async getProfile(userId) {
        return this.profiles.findOne({ where: { user_id: userId } });
    }
    async updateProfile(user, dto) {
        return this.dataSource.transaction(async (manager) => {
            let profile = await manager.findOne(zuno_user_profile_entity_1.ZunoUserProfile, {
                where: { user_id: user.id },
            });
            if (!profile) {
                profile = manager.create(zuno_user_profile_entity_1.ZunoUserProfile, { user_id: user.id });
            }
            const before = { ...profile };
            if (dto.preferredName !== undefined)
                profile.preferred_name = dto.preferredName;
            if (dto.displayName !== undefined)
                profile.display_name = dto.displayName;
            if (dto.countryCode !== undefined)
                profile.country_code = dto.countryCode;
            if (dto.city !== undefined)
                profile.city = dto.city;
            if (dto.occupation !== undefined)
                profile.occupation = dto.occupation;
            if (dto.preferredLanguage !== undefined) {
                profile.preferred_language = dto.preferredLanguage;
            }
            const savedProfile = await manager.save(zuno_user_profile_entity_1.ZunoUserProfile, profile);
            let savedUser = user;
            if (dto.timezone !== undefined) {
                user.timezone = dto.timezone;
                savedUser = await manager.save(zuno_user_entity_1.ZunoUser, user);
            }
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
    async getBirthProfile(userId) {
        return this.birthProfiles.findOne({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }
    async upsertBirthProfile(user, dto) {
        const unknownTime = dto.timeAccuracy === enums_1.BirthTimeAccuracy.UNKNOWN;
        if (!unknownTime && !dto.timeOfBirth) {
            throw zuno_exception_1.ZunoException.validation([{ field: 'timeOfBirth', code: 'REQUIRED_FOR_ACCURACY' }], 'A birth time is needed unless the accuracy is UNKNOWN.');
        }
        const timeOfBirth = unknownTime ? null : normaliseTime(dto.timeOfBirth);
        return this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(zuno_birth_profile_entity_1.ZunoBirthProfile, {
                where: { user_id: user.id },
                order: { created_at: 'DESC' },
            });
            const before = existing ? { id: existing.id } : undefined;
            const target = existing ??
                manager.create(zuno_birth_profile_entity_1.ZunoBirthProfile, {
                    user_id: user.id,
                    source: enums_1.BirthProfileSource.USER_PROVIDED,
                });
            const placeChanged = target.place_name !== dto.placeName ||
                target.place_country_code !== (dto.placeCountryCode ?? null);
            target.date_of_birth = dto.dateOfBirth;
            target.time_of_birth = timeOfBirth;
            target.time_accuracy = dto.timeAccuracy;
            target.place_name = dto.placeName;
            target.place_country_code = dto.placeCountryCode ?? null;
            target.source = enums_1.BirthProfileSource.USER_PROVIDED;
            if (placeChanged) {
                target.latitude = null;
                target.longitude = null;
                target.timezone_at_birth = null;
            }
            const saved = await manager.save(zuno_birth_profile_entity_1.ZunoBirthProfile, target);
            const refreshedUser = await this.refreshOnboarding(manager, user);
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
                aggregateType: enums_1.ZunoAggregateType.BIRTH_PROFILE,
                aggregateId: saved.id,
                eventType: enums_1.ZunoEventType.BIRTH_PROFILE_UPDATED,
                payload: {
                    birth_profile_id: saved.id,
                    user_id: user.id,
                    requires_location_resolution: !saved.isCalculationReady,
                },
            });
            void refreshedUser;
            return saved;
        });
    }
    async refreshOnboarding(manager, user) {
        const profile = await manager.findOne(zuno_user_profile_entity_1.ZunoUserProfile, {
            where: { user_id: user.id },
        });
        const birth = await manager.findOne(zuno_birth_profile_entity_1.ZunoBirthProfile, {
            where: { user_id: user.id },
        });
        let next;
        if (!profile?.preferred_name) {
            next = enums_1.OnboardingStatus.NOT_STARTED;
        }
        else if (!birth) {
            next = enums_1.OnboardingStatus.BIRTH_PENDING;
        }
        else if (!birth.isCalculationReady) {
            next = enums_1.OnboardingStatus.PROFILE_MINIMAL;
        }
        else {
            next = enums_1.OnboardingStatus.COMPLETED;
        }
        if (user.onboarding_status === next)
            return user;
        user.onboarding_status = next;
        return manager.save(zuno_user_entity_1.ZunoUser, user);
    }
};
exports.ZunoProfileService = ZunoProfileService;
exports.ZunoProfileService = ZunoProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_user_entity_1.ZunoUser)),
    __param(1, (0, typeorm_1.InjectRepository)(zuno_user_profile_entity_1.ZunoUserProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(zuno_birth_profile_entity_1.ZunoBirthProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        outbox_service_1.OutboxService,
        zuno_audit_service_1.ZunoAuditService,
        zuno_ownership_service_1.ZunoOwnershipService,
        typeorm_2.DataSource])
], ZunoProfileService);
function normaliseTime(value) {
    return value.length === 5 ? `${value}:00` : value;
}
//# sourceMappingURL=zuno-profile.service.js.map