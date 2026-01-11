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
exports.Challenge = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
let Challenge = class Challenge extends base_entity_1.BaseEntity {
};
exports.Challenge = Challenge;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Challenge.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Challenge.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'challenge_type' }),
    __metadata("design:type", String)
], Challenge.prototype, "challenge_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'duration_days' }),
    __metadata("design:type", Number)
], Challenge.prototype, "duration_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'daily_tasks' }),
    __metadata("design:type", Array)
], Challenge.prototype, "daily_tasks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], Challenge.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Challenge.prototype, "metadata", void 0);
exports.Challenge = Challenge = __decorate([
    (0, typeorm_1.Entity)('challenges'),
    (0, typeorm_1.Index)(['challenge_type', 'is_active'])
], Challenge);
//# sourceMappingURL=challenge.entity.js.map