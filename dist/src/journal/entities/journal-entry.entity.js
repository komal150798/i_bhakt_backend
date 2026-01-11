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
exports.JournalEntry = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let JournalEntry = class JournalEntry extends base_entity_1.BaseEntity {
};
exports.JournalEntry = JournalEntry;
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'user_id' }),
    __metadata("design:type", Number)
], JournalEntry.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], JournalEntry.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'entry_date' }),
    __metadata("design:type", Date)
], JournalEntry.prototype, "entry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'entry_type' }),
    __metadata("design:type", String)
], JournalEntry.prototype, "entry_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'sentiment_analysis' }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "sentiment_analysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'nlp_analysis' }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "nlp_analysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'karma_entry_id' }),
    __metadata("design:type", Number)
], JournalEntry.prototype, "karma_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], JournalEntry.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id', referencedColumnName: 'id' }),
    __metadata("design:type", user_entity_1.User)
], JournalEntry.prototype, "user", void 0);
exports.JournalEntry = JournalEntry = __decorate([
    (0, typeorm_1.Entity)('journal_entries'),
    (0, typeorm_1.Index)(['user_id', 'entry_date']),
    (0, typeorm_1.Index)(['user_id', 'is_deleted'])
], JournalEntry);
//# sourceMappingURL=journal-entry.entity.js.map