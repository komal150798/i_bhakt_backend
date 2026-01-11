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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppJournalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const journal_service_1 = require("../journal.service");
const create_journal_entry_dto_1 = require("../dto/create-journal-entry.dto");
const get_journal_entries_dto_1 = require("../dto/get-journal-entries.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AppJournalController = class AppJournalController {
    constructor(journalService) {
        this.journalService = journalService;
    }
    async createJournalEntry(dto, user) {
        const entry = await this.journalService.createJournalEntry(user.id, dto);
        return {
            success: true,
            data: {
                id: entry.id,
                content: entry.content,
                entry_date: entry.entry_date,
                entry_type: entry.entry_type,
                sentiment: entry.sentiment_analysis,
                karma_entry_id: entry.karma_entry_id,
                created_at: entry.added_date,
            },
        };
    }
    async getJournalEntries(query, user) {
        const result = await this.journalService.getJournalEntries(user.id, query);
        return {
            success: true,
            data: {
                entries: result.entries.map(entry => ({
                    id: entry.id,
                    content: entry.content,
                    entry_date: entry.entry_date,
                    entry_type: entry.entry_type,
                    sentiment: entry.sentiment_analysis,
                    karma_entry_id: entry.karma_entry_id,
                    created_at: entry.added_date,
                })),
                total: result.total,
                limit: query.limit || 20,
                offset: query.offset || 0,
            },
        };
    }
    async getJournalEntry(id, user) {
        const entry = await this.journalService.getJournalEntryById(user.id, id);
        return {
            success: true,
            data: {
                id: entry.id,
                content: entry.content,
                entry_date: entry.entry_date,
                entry_type: entry.entry_type,
                sentiment: entry.sentiment_analysis,
                nlp_analysis: entry.nlp_analysis,
                karma_entry_id: entry.karma_entry_id,
                created_at: entry.added_date,
                updated_at: entry.modify_date,
            },
        };
    }
    async updateJournalEntry(id, dto, user) {
        const entry = await this.journalService.updateJournalEntry(user.id, id, dto);
        return {
            success: true,
            data: {
                id: entry.id,
                content: entry.content,
                entry_type: entry.entry_type,
                updated_at: entry.modify_date,
            },
        };
    }
    async deleteJournalEntry(id, user) {
        await this.journalService.deleteJournalEntry(user.id, id);
        return {
            success: true,
            message: 'Journal entry deleted successfully',
        };
    }
};
exports.AppJournalController = AppJournalController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new journal entry (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Journal entry created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_journal_entry_dto_1.CreateJournalEntryDto, Object]),
    __metadata("design:returntype", Promise)
], AppJournalController.prototype, "createJournalEntry", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get journal entries (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Journal entries retrieved successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_journal_entries_dto_1.GetJournalEntriesDto, Object]),
    __metadata("design:returntype", Promise)
], AppJournalController.prototype, "getJournalEntries", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get journal entry by ID (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Journal entry retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Journal entry not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppJournalController.prototype, "getJournalEntry", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update journal entry (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Journal entry updated successfully',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AppJournalController.prototype, "updateJournalEntry", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete journal entry (Mobile App)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Journal entry deleted successfully',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AppJournalController.prototype, "deleteJournalEntry", null);
exports.AppJournalController = AppJournalController = __decorate([
    (0, swagger_1.ApiTags)('Journal (App)'),
    (0, common_1.Controller)('app/journal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [journal_service_1.JournalService])
], AppJournalController);
//# sourceMappingURL=app-journal.controller.js.map