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
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const admin_user_entity_1 = require("../../users/entities/admin-user.entity");
let SeedService = SeedService_1 = class SeedService {
    constructor(adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async onModuleInit() {
        await this.seedAdminUser();
    }
    async seedAdminUser() {
        const adminUsername = 'komal';
        const adminPassword = 'komal';
        const adminEmail = `${adminUsername}@admin.com`;
        try {
            const existingAdmin = await this.adminUserRepository.findOne({
                where: [
                    { email: adminEmail, is_deleted: false },
                    { username: adminUsername, is_deleted: false },
                ],
            });
            if (existingAdmin) {
                this.logger.log('Default admin user already exists, skipping seed');
                return;
            }
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
            const admin = this.adminUserRepository.create({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                first_name: 'Admin',
                last_name: 'User',
                is_active: true,
                is_enabled: true,
                role_id: null,
            });
            await this.adminUserRepository.save(admin);
            this.logger.log('✅ Default admin user created successfully');
            this.logger.log(`   Username: ${adminUsername}`);
            this.logger.log(`   Email: ${adminEmail}`);
            this.logger.log(`   Password: ${adminPassword}`);
            this.logger.warn('⚠️  Please change the default password after first login!');
        }
        catch (error) {
            this.logger.error('Failed to seed admin user:', error);
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map