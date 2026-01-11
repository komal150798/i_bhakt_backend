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
const admin_user_entity_1 = require("../../../users/entities/admin-user.entity");
let SeedService = SeedService_1 = class SeedService {
    constructor(adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
        this.logger = new common_1.Logger(SeedService_1.name);
    }
    async checkTableExists() {
        try {
            await this.adminUserRepository.query('SELECT 1 FROM adm_users LIMIT 1');
            return true;
        }
        catch (error) {
            if (error?.message?.includes('does not exist') || error?.code === '42P01') {
                return false;
            }
            throw error;
        }
    }
    async onModuleInit() {
        await this.seedAdminUser();
    }
    async seedAdminUser() {
        const adminUsername = 'komal';
        const adminPassword = 'komal';
        const maxRetries = 5;
        const retryDelay = 2000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const existingAdmin = await this.adminUserRepository.findOne({
                    where: [
                        { username: adminUsername },
                        { email: `${adminUsername}@admin.com` },
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
                    email: `${adminUsername}@admin.com`,
                    password: hashedPassword,
                    first_name: 'Admin',
                    last_name: 'User',
                    is_active: true,
                });
                await this.adminUserRepository.save(admin);
                this.logger.log('✅ Default admin user created successfully');
                this.logger.log(`   Username: ${adminUsername}`);
                this.logger.log(`   Password: ${adminPassword}`);
                this.logger.warn('⚠️  Please change the default password after first login!');
                return;
            }
            catch (error) {
                if (error?.message?.includes('does not exist') || error?.code === '42P01') {
                    if (attempt < maxRetries) {
                        this.logger.warn(`Tables not ready yet, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})...`);
                        await new Promise((resolve) => setTimeout(resolve, retryDelay));
                        continue;
                    }
                    else {
                        this.logger.error(`Failed to seed admin user after ${maxRetries} attempts. Tables may not have been created.`);
                        this.logger.error('Error:', error.message);
                        return;
                    }
                }
                else {
                    this.logger.error('Failed to seed admin user:', error);
                    return;
                }
            }
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed-admin.service.js.map