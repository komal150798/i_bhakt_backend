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
exports.ZunoKarmaEntryRevision = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const karma_enum_1 = require("../enums/karma.enum");
let ZunoKarmaEntryRevision = class ZunoKarmaEntryRevision extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoKarmaEntryRevision = ZunoKarmaEntryRevision;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'karma_entry_id' }),
    __metadata("design:type", String)
], ZunoKarmaEntryRevision.prototype, "karma_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ZunoKarmaEntryRevision.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'previous_value' }),
    __metadata("design:type", Object)
], ZunoKarmaEntryRevision.prototype, "previous_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'new_value' }),
    __metadata("design:type", Object)
], ZunoKarmaEntryRevision.prototype, "new_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, name: 'changed_by' }),
    __metadata("design:type", String)
], ZunoKarmaEntryRevision.prototype, "changed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZunoKarmaEntryRevision.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'raw_text_changed', default: false }),
    __metadata("design:type", Boolean)
], ZunoKarmaEntryRevision.prototype, "raw_text_changed", void 0);
exports.ZunoKarmaEntryRevision = ZunoKarmaEntryRevision = __decorate([
    (0, typeorm_1.Entity)('zuno_karma_entry_revisions'),
    (0, typeorm_1.Index)('idx_zuno_karma_revisions_entry', ['karma_entry_id', 'created_at']),
    (0, typeorm_1.Index)('idx_zuno_karma_revisions_user', ['user_id', 'created_at'])
], ZunoKarmaEntryRevision);
//# sourceMappingURL=zuno-karma-entry-revision.entity.js.map