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
exports.EmailCredential = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../entities/base.entity");
let EmailCredential = class EmailCredential extends base_entity_1.BaseEntity {
};
exports.EmailCredential = EmailCredential;
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'provider_name' }),
    __metadata("design:type", String)
], EmailCredential.prototype, "provider_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'api_key' }),
    __metadata("design:type", String)
], EmailCredential.prototype, "api_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], EmailCredential.prototype, "domain", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'from_email' }),
    __metadata("design:type", String)
], EmailCredential.prototype, "from_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'from_name' }),
    __metadata("design:type", String)
], EmailCredential.prototype, "from_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'base_url' }),
    __metadata("design:type", String)
], EmailCredential.prototype, "base_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'extra_config' }),
    __metadata("design:type", Object)
], EmailCredential.prototype, "extra_config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_active' }),
    __metadata("design:type", Boolean)
], EmailCredential.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'created_by' }),
    __metadata("design:type", Number)
], EmailCredential.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'updated_by' }),
    __metadata("design:type", Number)
], EmailCredential.prototype, "updated_by", void 0);
exports.EmailCredential = EmailCredential = __decorate([
    (0, typeorm_1.Entity)('email_credentials'),
    (0, typeorm_1.Index)(['provider_name']),
    (0, typeorm_1.Index)(['is_active'])
], EmailCredential);
//# sourceMappingURL=email-credential.entity.js.map