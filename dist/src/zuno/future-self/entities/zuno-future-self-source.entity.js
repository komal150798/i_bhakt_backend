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
exports.ZunoFutureSelfSource = void 0;
const typeorm_1 = require("typeorm");
const zuno_base_entity_1 = require("../../common/entities/zuno-base.entity");
const zuno_future_self_narrative_entity_1 = require("./zuno-future-self-narrative.entity");
let ZunoFutureSelfSource = class ZunoFutureSelfSource extends zuno_base_entity_1.ZunoImmutableEntity {
};
exports.ZunoFutureSelfSource = ZunoFutureSelfSource;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'future_self_narrative_id' }),
    __metadata("design:type", String)
], ZunoFutureSelfSource.prototype, "future_self_narrative_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'source_entity_type' }),
    __metadata("design:type", String)
], ZunoFutureSelfSource.prototype, "source_entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'source_entity_id' }),
    __metadata("design:type", String)
], ZunoFutureSelfSource.prototype, "source_entity_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => zuno_future_self_narrative_entity_1.ZunoFutureSelfNarrative, (narrative) => narrative.sources, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'future_self_narrative_id' }),
    __metadata("design:type", zuno_future_self_narrative_entity_1.ZunoFutureSelfNarrative)
], ZunoFutureSelfSource.prototype, "narrative", void 0);
exports.ZunoFutureSelfSource = ZunoFutureSelfSource = __decorate([
    (0, typeorm_1.Entity)('zuno_future_self_sources'),
    (0, typeorm_1.Index)('idx_zuno_fs_sources_narrative', ['future_self_narrative_id']),
    (0, typeorm_1.Index)('idx_zuno_fs_sources_entity', ['source_entity_type', 'source_entity_id'])
], ZunoFutureSelfSource);
//# sourceMappingURL=zuno-future-self-source.entity.js.map