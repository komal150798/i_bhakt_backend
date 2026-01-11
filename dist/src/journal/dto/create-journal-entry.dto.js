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
exports.CreateJournalEntryDto = exports.JournalEntryType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var JournalEntryType;
(function (JournalEntryType) {
    JournalEntryType["GRATITUDE"] = "gratitude";
    JournalEntryType["REFLECTION"] = "reflection";
    JournalEntryType["GOAL"] = "goal";
    JournalEntryType["GENERAL"] = "general";
    JournalEntryType["LEDGER"] = "ledger";
})(JournalEntryType || (exports.JournalEntryType = JournalEntryType = {}));
class CreateJournalEntryDto {
}
exports.CreateJournalEntryDto = CreateJournalEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Today I helped a friend in need...', description: 'Journal entry content' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-15', description: 'Entry date (defaults to today)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "entry_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: JournalEntryType,
        example: JournalEntryType.GENERAL,
        description: 'Type of journal entry'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(JournalEntryType),
    __metadata("design:type", String)
], CreateJournalEntryDto.prototype, "entry_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateJournalEntryDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-journal-entry.dto.js.map