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
exports.SmsCredential = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../entities/base.entity");
let SmsCredential = class SmsCredential extends base_entity_1.BaseEntity {
};
exports.SmsCredential = SmsCredential;
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'provider_name' }),
    __metadata("design:type", String)
], SmsCredential.prototype, "provider_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'api_key' }),
    __metadata("design:type", String)
], SmsCredential.prototype, "api_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'api_secret' }),
    __metadata("design:type", String)
], SmsCredential.prototype, "api_secret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'sender_id' }),
    __metadata("design:type", String)
], SmsCredential.prototype, "sender_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'base_url' }),
    __metadata("design:type", String)
], SmsCredential.prototype, "base_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'extra_config' }),
    __metadata("design:type", Object)
], SmsCredential.prototype, "extra_config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_active' }),
    __metadata("design:type", Boolean)
], SmsCredential.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'created_by' }),
    __metadata("design:type", Number)
], SmsCredential.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, name: 'updated_by' }),
    __metadata("design:type", Number)
], SmsCredential.prototype, "updated_by", void 0);
exports.SmsCredential = SmsCredential = __decorate([
    (0, typeorm_1.Entity)('sms_credentials'),
    (0, typeorm_1.Index)(['provider_name']),
    (0, typeorm_1.Index)(['is_active'])
], SmsCredential);
//# sourceMappingURL=sms-credential.entity.js.map