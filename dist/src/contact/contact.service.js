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
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contact_inquiry_entity_1 = require("./entities/contact-inquiry.entity");
let ContactService = ContactService_1 = class ContactService {
    constructor(contactRepository) {
        this.contactRepository = contactRepository;
        this.logger = new common_1.Logger(ContactService_1.name);
    }
    async create(dto) {
        const inquiry = this.contactRepository.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone || null,
            subject: dto.subject,
            message: dto.message,
            status: 'pending',
        });
        const saved = await this.contactRepository.save(inquiry);
        this.logger.log(`Contact inquiry saved: ${saved.id} from ${dto.email}`);
        return saved;
    }
    async findAll() {
        return this.contactRepository.find({
            where: { is_deleted: false },
            order: { added_date: 'DESC' },
        });
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_inquiry_entity_1.ContactInquiry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContactService);
//# sourceMappingURL=contact.service.js.map