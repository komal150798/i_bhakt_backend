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
var RulebookActorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulebookActorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const admin_user_entity_1 = require("../../../users/entities/admin-user.entity");
const zuno_exception_1 = require("../../common/errors/zuno.exception");
const error_codes_enum_1 = require("../../common/errors/error-codes.enum");
const enums_1 = require("../../common/enums");
let RulebookActorService = RulebookActorService_1 = class RulebookActorService {
    constructor(admins) {
        this.admins = admins;
        this.logger = new common_1.Logger(RulebookActorService_1.name);
    }
    async resolve(principal) {
        if (!principal || principal.type !== 'admin') {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                message: 'Rulebook management requires an administrator account.',
                internalDetail: 'non-admin principal on rulebook route',
            });
        }
        const admin = await this.admins.findOne({
            where: { unique_id: principal.unique_id, is_deleted: false },
        });
        if (!admin) {
            throw new zuno_exception_1.ZunoException(error_codes_enum_1.ZunoErrorCode.FORBIDDEN, {
                internalDetail: 'admin record not found for principal',
            });
        }
        const role = this.roleFor(admin.email ?? '');
        const permissions = [...(enums_1.RULEBOOK_ROLE_PERMISSIONS[role] ?? [])];
        return {
            userId: admin.unique_id,
            role,
            permissions,
        };
    }
    roleFor(email) {
        const normalised = email.trim().toLowerCase();
        if (!normalised)
            return enums_1.RulebookRole.SUPPORT;
        if (this.listFromEnv('ZUNO_RULEBOOK_SYSTEM_ADMINS').includes(normalised)) {
            return enums_1.RulebookRole.SYSTEM_ADMIN;
        }
        if (this.listFromEnv('ZUNO_RULEBOOK_SME_REVIEWERS').includes(normalised)) {
            return enums_1.RulebookRole.ASTROLOGY_SME;
        }
        if (this.listFromEnv('ZUNO_RULEBOOK_PRODUCT_ADMINS').includes(normalised)) {
            return enums_1.RulebookRole.PRODUCT_ADMIN;
        }
        this.logger.debug('Admin has no configured rulebook role; defaulting to read-only SUPPORT.');
        return enums_1.RulebookRole.SUPPORT;
    }
    listFromEnv(key) {
        return (process.env[key] ?? '')
            .split(',')
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
    }
    static has(actor, permission) {
        return actor.permissions.includes(permission);
    }
};
exports.RulebookActorService = RulebookActorService;
exports.RulebookActorService = RulebookActorService = RulebookActorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RulebookActorService);
//# sourceMappingURL=rulebook-actor.service.js.map