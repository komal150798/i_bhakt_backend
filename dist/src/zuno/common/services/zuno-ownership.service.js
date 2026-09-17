"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoOwnershipService = void 0;
const common_1 = require("@nestjs/common");
const zuno_exception_1 = require("../errors/zuno.exception");
let ZunoOwnershipService = class ZunoOwnershipService {
    require(entity, userId, entityLabel) {
        if (!entity) {
            throw zuno_exception_1.ZunoException.notFound(`${entityLabel} not found`);
        }
        if (entity.user_id !== userId) {
            throw zuno_exception_1.ZunoException.notFound(`${entityLabel} ownership mismatch (masked as not found)`);
        }
        return entity;
    }
    assertVersion(entity, expectedVersion) {
        if (expectedVersion === undefined || expectedVersion === null)
            return;
        if (entity.version !== expectedVersion) {
            throw zuno_exception_1.ZunoException.staleVersion(expectedVersion, entity.version);
        }
    }
};
exports.ZunoOwnershipService = ZunoOwnershipService;
exports.ZunoOwnershipService = ZunoOwnershipService = __decorate([
    (0, common_1.Injectable)()
], ZunoOwnershipService);
//# sourceMappingURL=zuno-ownership.service.js.map