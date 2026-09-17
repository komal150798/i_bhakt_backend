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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoUser = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_user_profile_entity_1 = require("./zuno-user-profile.entity");
const zuno_birth_profile_entity_1 = require("./zuno-birth-profile.entity");
let ZunoUser = class ZunoUser extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoUser = ZunoUser;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'auth_subject' }),
    __metadata("design:type", String)
], ZunoUser.prototype, "auth_subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'customer_id', nullable: true }),
    __metadata("design:type", String)
], ZunoUser.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.ZunoUserStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], ZunoUser.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ZunoUser.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], ZunoUser.prototype, "locale", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        name: 'onboarding_status',
        default: enums_1.OnboardingStatus.NOT_STARTED,
    }),
    __metadata("design:type", String)
], ZunoUser.prototype, "onboarding_status", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => zuno_user_profile_entity_1.ZunoUserProfile, (profile) => profile.user),
    __metadata("design:type", zuno_user_profile_entity_1.ZunoUserProfile)
], ZunoUser.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => zuno_birth_profile_entity_1.ZunoBirthProfile, (birth) => birth.user),
    __metadata("design:type", Array)
], ZunoUser.prototype, "birth_profiles", void 0);
exports.ZunoUser = ZunoUser = __decorate([
    (0, typeorm_1.Entity)('zuno_users'),
    (0, typeorm_1.Index)('idx_zuno_users_auth_subject', ['auth_subject'], { unique: true }),
    (0, typeorm_1.Index)('idx_zuno_users_status', ['status'])
], ZunoUser);
//# sourceMappingURL=zuno-user.entity.js.map