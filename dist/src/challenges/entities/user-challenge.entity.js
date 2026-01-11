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
exports.UserChallenge = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const challenge_entity_1 = require("./challenge.entity");
let UserChallenge = class UserChallenge extends base_entity_1.BaseEntity {
};
exports.UserChallenge = UserChallenge;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], UserChallenge.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'challenge_id' }),
    __metadata("design:type", Number)
], UserChallenge.prototype, "challenge_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", Date)
], UserChallenge.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true, name: 'end_date' }),
    __metadata("design:type", Date)
], UserChallenge.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'active' }),
    __metadata("design:type", String)
], UserChallenge.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'current_day' }),
    __metadata("design:type", Number)
], UserChallenge.prototype, "current_day", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'completed_days' }),
    __metadata("design:type", Array)
], UserChallenge.prototype, "completed_days", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserChallenge.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], UserChallenge.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => challenge_entity_1.Challenge, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'challenge_id', referencedColumnName: 'id' }),
    __metadata("design:type", challenge_entity_1.Challenge)
], UserChallenge.prototype, "challenge", void 0);
exports.UserChallenge = UserChallenge = __decorate([
    (0, typeorm_1.Entity)('user_challenges'),
    (0, typeorm_1.Index)(['user_id', 'challenge_id']),
    (0, typeorm_1.Index)(['user_id', 'status'])
], UserChallenge);
//# sourceMappingURL=user-challenge.entity.js.map