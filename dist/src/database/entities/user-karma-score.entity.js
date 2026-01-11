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
exports.UserKarmaScore = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserKarmaScore = class UserKarmaScore {
};
exports.UserKarmaScore = UserKarmaScore;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserKarmaScore.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true, nullable: false }),
    __metadata("design:type", Number)
], UserKarmaScore.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.karma_score, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserKarmaScore.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false, default: 0.0 }),
    __metadata("design:type", Number)
], UserKarmaScore.prototype, "cumulative_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false, default: 0.0 }),
    __metadata("design:type", Number)
], UserKarmaScore.prototype, "positive_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false, default: 0.0 }),
    __metadata("design:type", Number)
], UserKarmaScore.prototype, "negative_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UserKarmaScore.prototype, "last_recalculated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserKarmaScore.prototype, "observations", void 0);
exports.UserKarmaScore = UserKarmaScore = __decorate([
    (0, typeorm_1.Entity)('user_karma_scores')
], UserKarmaScore);
//# sourceMappingURL=user-karma-score.entity.js.map