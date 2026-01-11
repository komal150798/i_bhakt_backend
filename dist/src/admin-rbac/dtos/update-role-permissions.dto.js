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
exports.UpdateRolePermissionsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PermissionUpdateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Permission ID' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PermissionUpdateDto.prototype, "permission_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is allowed for this role' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PermissionUpdateDto.prototype, "is_allowed", void 0);
class UpdateRolePermissionsDto {
}
exports.UpdateRolePermissionsDto = UpdateRolePermissionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PermissionUpdateDto], description: 'List of permissions to update' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PermissionUpdateDto),
    __metadata("design:type", Array)
], UpdateRolePermissionsDto.prototype, "permissions", void 0);
//# sourceMappingURL=update-role-permissions.dto.js.map