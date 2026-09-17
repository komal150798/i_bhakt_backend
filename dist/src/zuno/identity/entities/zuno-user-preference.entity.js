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
exports.ZunoUserPreference = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const enums_1 = require("../../common/enums");
let ZunoUserPreference = class ZunoUserPreference extends zuno_base_entity_1.ZunoBaseEntity {
};
exports.ZunoUserPreference = ZunoUserPreference;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoUserPreference.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'preference_key' }),
    __metadata("design:type", String)
], ZunoUserPreference.prototype, "preference_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'preference_value' }),
    __metadata("design:type", Object)
], ZunoUserPreference.prototype, "preference_value", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 32,
        default: enums_1.PreferenceSource.USER_EXPLICIT,
    }),
    __metadata("design:type", String)
], ZunoUserPreference.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], ZunoUserPreference.prototype, "is_active", void 0);
exports.ZunoUserPreference = ZunoUserPreference = __decorate([
    (0, typeorm_1.Entity)('zuno_user_preferences'),
    (0, typeorm_1.Index)('idx_zuno_user_prefs_lookup', ['user_id', 'preference_key', 'is_active'])
], ZunoUserPreference);
//# sourceMappingURL=zuno-user-preference.entity.js.map