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
exports.JournalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const journal_entry_entity_1 = require("./entities/journal-entry.entity");
const create_journal_entry_dto_1 = require("./dto/create-journal-entry.dto");
const karma_service_1 = require("../karma/services/karma.service");
const constants_service_1 = require("../common/constants/constants.service");
let JournalService = class JournalService {
    constructor(journalRepository, karmaService, constantsService) {
        this.journalRepository = journalRepository;
        this.karmaService = karmaService;
        this.constantsService = constantsService;
    }
    async createJournalEntry(userId, dto) {
        if (!dto.content || dto.content.trim().length === 0) {
            throw new common_1.BadRequestException('Journal content is required');
        }
        const entryDate = dto.entry_date ? new Date(dto.entry_date) : new Date();
        entryDate.setHours(0, 0, 0, 0);
        const sentiment = await this.analyzeSentiment(dto.content);
        const journalEntry = this.journalRepository.create({
            user_id: userId,
            content: dto.content,
            entry_date: entryDate,
            entry_type: dto.entry_type || create_journal_entry_dto_1.JournalEntryType.GENERAL,
            sentiment_analysis: sentiment,
            nlp_analysis: {
                keywords: this.extractKeywords(dto.content),
            },
            metadata: dto.metadata || {},
        });
        const saved = await this.journalRepository.save(journalEntry);
        if (dto.entry_type === create_journal_entry_dto_1.JournalEntryType.LEDGER) {
            try {
                const karmaEntry = await this.karmaService.addKarmaAction({
                    user_id: userId,
                    action_text: dto.content,
                    timestamp: entryDate,
                });
                saved.karma_entry_id = karmaEntry.id;
                await this.journalRepository.save(saved);
            }
            catch (error) {
                console.warn('Failed to create karma entry for journal:', error);
            }
        }
        return saved;
    }
    async getJournalEntries(userId, dto) {
        const query = this.journalRepository.createQueryBuilder('entry')
            .where('entry.user_id = :userId', { userId })
            .andWhere('entry.is_deleted = false');
        if (dto.from) {
            const fromDate = new Date(dto.from);
            fromDate.setHours(0, 0, 0, 0);
            query.andWhere('entry.entry_date >= :from', { from: fromDate });
        }
        if (dto.to) {
            const toDate = new Date(dto.to);
            toDate.setHours(23, 59, 59, 999);
            query.andWhere('entry.entry_date <= :to', { to: toDate });
        }
        if (dto.type) {
            query.andWhere('entry.entry_type = :type', { type: dto.type });
        }
        const total = await query.getCount();
        const limit = dto.limit || 20;
        const offset = dto.offset || 0;
        query.skip(offset).take(limit);
        query.orderBy('entry.entry_date', 'DESC')
            .addOrderBy('entry.created_at', 'DESC');
        const entries = await query.getMany();
        return { entries, total };
    }
    async getJournalEntryById(userId, entryId) {
        const entry = await this.journalRepository.findOne({
            where: {
                id: entryId,
                user_id: userId,
                is_deleted: false,
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Journal entry not found');
        }
        return entry;
    }
    async updateJournalEntry(userId, entryId, updateData) {
        const entry = await this.getJournalEntryById(userId, entryId);
        if (updateData.content) {
            entry.content = updateData.content;
            entry.sentiment_analysis = await this.analyzeSentiment(updateData.content);
            entry.nlp_analysis = {
                keywords: this.extractKeywords(updateData.content),
            };
        }
        if (updateData.entry_type) {
            entry.entry_type = updateData.entry_type;
        }
        if (updateData.metadata) {
            entry.metadata = { ...entry.metadata, ...updateData.metadata };
        }
        return await this.journalRepository.save(entry);
    }
    async deleteJournalEntry(userId, entryId) {
        const entry = await this.getJournalEntryById(userId, entryId);
        entry.is_deleted = true;
        await this.journalRepository.save(entry);
    }
    async analyzeSentiment(content) {
        const lowerContent = content.toLowerCase();
        const positiveWords = await this.constantsService.getJournalPositiveWords();
        const negativeWords = await this.constantsService.getJournalNegativeWords();
        let positiveCount = 0;
        let negativeCount = 0;
        positiveWords.forEach(word => {
            if (lowerContent.includes(word))
                positiveCount++;
        });
        negativeWords.forEach(word => {
            if (lowerContent.includes(word))
                negativeCount++;
        });
        const score = positiveCount > negativeCount
            ? 0.5 + (positiveCount / (positiveCount + negativeCount + 1)) * 0.5
            : 0.5 - (negativeCount / (positiveCount + negativeCount + 1)) * 0.5;
        return {
            sentiment: score > 0.6 ? 'positive' : score < 0.4 ? 'negative' : 'neutral',
            score: Math.max(0, Math.min(1, score)),
            emotions: [],
        };
    }
    extractKeywords(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 4);
        return [...new Set(words)].slice(0, 5);
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        karma_service_1.KarmaService,
        constants_service_1.ConstantsService])
], JournalService);
//# sourceMappingURL=journal.service.js.map