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
var ZunoUserResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoUserResolverService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zuno_user_entity_1 = require("../entities/zuno-user.entity");
const zuno_user_profile_entity_1 = require("../entities/zuno-user-profile.entity");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
const customer_entity_1 = require("../../../users/entities/customer.entity");
let ZunoUserResolverService = ZunoUserResolverService_1 = class ZunoUserResolverService {
    constructor(users, customers, dataSource) {
        this.users = users;
        this.customers = customers;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(ZunoUserResolverService_1.name);
    }
    async resolve(principal) {
        if (!principal?.unique_id) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.AUTHENTICATION_REQUIRED, {
                internalDetail: 'principal missing unique_id',
            });
        }
        if (principal.type === 'admin') {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                internalDetail: 'admin principal cannot access ZUNO user endpoints',
            });
        }
        const existing = await this.users.findOne({
            where: { auth_subject: principal.unique_id },
        });
        if (existing) {
            this.assertUsable(existing);
            return existing;
        }
        return this.provision(principal);
    }
    async provision(principal) {
        const customer = await this.customers.findOne({
            where: { unique_id: principal.unique_id, is_deleted: false },
        });
        return this.dataSource.transaction(async (manager) => {
            const raced = await manager.findOne(zuno_user_entity_1.ZunoUser, {
                where: { auth_subject: principal.unique_id },
            });
            if (raced)
                return raced;
            const user = manager.create(zuno_user_entity_1.ZunoUser, {
                auth_subject: principal.unique_id,
                customer_id: customer ? String(customer.id) : null,
                status: enums_1.ZunoUserStatus.ACTIVE,
                timezone: customer?.timezone ?? null,
                locale: null,
                onboarding_status: enums_1.OnboardingStatus.NOT_STARTED,
            });
            const saved = await manager.save(zuno_user_entity_1.ZunoUser, user);
            const profile = manager.create(zuno_user_profile_entity_1.ZunoUserProfile, {
                user_id: saved.id,
                preferred_name: customer?.first_name ?? null,
                display_name: customer?.full_name ?? null,
                country_code: null,
                city: null,
                occupation: null,
                preferred_language: null,
            });
            await manager.save(zuno_user_profile_entity_1.ZunoUserProfile, profile);
            this.logger.log(`Provisioned ZUNO user ${saved.id}`);
            return saved;
        });
    }
    assertUsable(user) {
        if (user.status === enums_1.ZunoUserStatus.DELETED ||
            user.status === enums_1.ZunoUserStatus.PENDING_DELETION) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                internalDetail: `zuno user ${user.id} status ${user.status}`,
            });
        }
        if (user.status === enums_1.ZunoUserStatus.SUSPENDED) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                internalDetail: `zuno user ${user.id} suspended`,
            });
        }
    }
};
exports.ZunoUserResolverService = ZunoUserResolverService;
exports.ZunoUserResolverService = ZunoUserResolverService = ZunoUserResolverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(zuno_user_entity_1.ZunoUser)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ZunoUserResolverService);
//# sourceMappingURL=zuno-user-resolver.service.js.map