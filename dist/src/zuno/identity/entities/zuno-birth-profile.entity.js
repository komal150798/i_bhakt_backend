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
exports.ZunoBirthProfile = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
const zuno_user_entity_1 = require("./zuno-user.entity");
let ZunoBirthProfile = class ZunoBirthProfile extends zuno_base_entity_1.ZunoVersionedEntity {
    get isCalculationReady() {
        return (this.latitude !== null &&
            this.longitude !== null &&
            this.timezone_at_birth !== null &&
            this.time_accuracy !== enums_1.BirthTimeAccuracy.UNKNOWN &&
            this.time_of_birth !== null);
    }
};
exports.ZunoBirthProfile = ZunoBirthProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'date_of_birth' }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "date_of_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'time_of_birth', nullable: true }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "time_of_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'time_accuracy',
        default: enums_1.BirthTimeAccuracy.UNKNOWN,
    }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "time_accuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'place_name' }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "place_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, name: 'place_country_code', nullable: true }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "place_country_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 64,
        name: 'timezone_at_birth',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "timezone_at_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.BirthProfileSource.USER_PROVIDED,
    }),
    __metadata("design:type", String)
], ZunoBirthProfile.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_user_entity_1.ZunoUser, (user) => user.birth_profiles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoBirthProfile.prototype, "user", void 0);
exports.ZunoBirthProfile = ZunoBirthProfile = __decorate([
    (0, typeorm_1.Entity)('zuno_birth_profiles'),
    (0, typeorm_1.Index)('idx_zuno_birth_profiles_user', ['user_id'])
], ZunoBirthProfile);
//# sourceMappingURL=zuno-birth-profile.entity.js.map