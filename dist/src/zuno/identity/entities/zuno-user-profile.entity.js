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
exports.ZunoUserProfile = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_user_entity_1 = require("./zuno-user.entity");
let ZunoUserProfile = class ZunoUserProfile extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoUserProfile = ZunoUserProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'preferred_name', nullable: true }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "preferred_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'display_name', nullable: true }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "display_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, name: 'country_code', nullable: true }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "country_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, nullable: true }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "occupation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 16,
        name: 'preferred_language',
        nullable: true,
    }),
    __metadata("design:type", String)
], ZunoUserProfile.prototype, "preferred_language", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => zuno_user_entity_1.ZunoUser, (user) => user.profile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", zuno_user_entity_1.ZunoUser)
], ZunoUserProfile.prototype, "user", void 0);
exports.ZunoUserProfile = ZunoUserProfile = __decorate([
    (0, typeorm_1.Entity)('zuno_user_profiles'),
    (0, typeorm_1.Index)('idx_zuno_user_profiles_user', ['user_id'], { unique: true })
], ZunoUserProfile);
//# sourceMappingURL=zuno-user-profile.entity.js.map