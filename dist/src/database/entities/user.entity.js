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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const dasha_record_entity_1 = require("./dasha-record.entity");
const user_subscription_entity_1 = require("./user-subscription.entity");
const karma_record_entity_1 = require("./karma-record.entity");
const user_karma_score_entity_1 = require("./user-karma-score.entity");
const daily_guidance_log_entity_1 = require("./daily-guidance-log.entity");
const questionnaire_session_entity_1 = require("./questionnaire-session.entity");
const daily_alignment_tip_entity_1 = require("./daily-alignment-tip.entity");
const referral_entity_1 = require("./referral.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "first_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "last_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "date_of_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "time_of_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "place_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: false, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "questionnaire_completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "questionnaire_last_completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, nullable: false, default: 'awaken' }),
    __metadata("design:type", String)
], User.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "referral_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "referred_by_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.referrals),
    (0, typeorm_1.JoinColumn)({ name: 'referred_by_id' }),
    __metadata("design:type", User)
], User.prototype, "referred_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "nakshatra", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], User.prototype, "pada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: false }),
    __metadata("design:type", Number)
], User.prototype, "moon_longitude_deg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "dasha_at_birth", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dasha_record_entity_1.DashaRecord, (dasha) => dasha.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "dasha_records", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_subscription_entity_1.UserSubscription, (subscription) => subscription.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => karma_record_entity_1.KarmaRecord, (karma) => karma.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "karma_records", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_karma_score_entity_1.UserKarmaScore, (score) => score.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "karma_scores", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_guidance_log_entity_1.DailyGuidanceLog, (log) => log.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "guidance_logs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => questionnaire_session_entity_1.QuestionnaireSession, (session) => session.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "questionnaire_sessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_alignment_tip_entity_1.DailyAlignmentTip, (tip) => tip.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "alignment_tips", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => referral_entity_1.Referral, (referral) => referral.referrer, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "referrals", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map