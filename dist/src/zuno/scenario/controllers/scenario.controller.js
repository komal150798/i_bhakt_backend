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
exports.ZunoScenarioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const zuno_user_guard_1 = require("../../common/guards/zuno-user.guard");
const zuno_user_decorator_1 = require("../../common/decorators/zuno-user.decorator");
const zuno_user_entity_1 = require("../../identity/entities/zuno-user.entity");
const zuno_response_interceptor_1 = require("../../common/interceptors/zuno-response.interceptor");
const zuno_exception_filter_1 = require("../../common/filters/zuno-exception.filter");
const idempotency_service_1 = require("../../common/services/idempotency.service");
const scenario_service_1 = require("../services/scenario.service");
const what_if_service_1 = require("../services/what-if.service");
const scenario_dtos_1 = require("../dtos/scenario.dtos");
let ZunoScenarioController = class ZunoScenarioController {
    constructor(scenarios, whatIf, idempotency) {
        this.scenarios = scenarios;
        this.whatIf = whatIf;
        this.idempotency = idempotency;
    }
    async generate(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'SCENARIO_GENERATE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { set, scenarios } = await this.scenarios.generate({
                user,
                challengeId: dto.challengeId,
                reason: dto.reason,
            });
            return {
                ...scenario_dtos_1.ScenarioSetView.from(set, scenarios.filter((scenario) => scenario.user_facing)),
            };
        });
    }
    async list(user, query) {
        const result = await this.scenarios.listCurrent(user, query.challengeId, {
            includeAll: query.includeAll,
        });
        if (!result)
            return null;
        return scenario_dtos_1.ScenarioSetView.from(result.set, result.scenarios);
    }
    async decide(user, scenarioId, dto) {
        const scenario = await this.scenarios.decide(user, scenarioId, dto.decision, dto.note, dto.version);
        return scenario_dtos_1.ScenarioView.from(scenario);
    }
    async triggered(user, scenarioId, dto) {
        const scenario = await this.scenarios.markTriggered(user, scenarioId, dto.note, dto.version);
        return scenario_dtos_1.ScenarioView.from(scenario);
    }
    async explore(user, dto, idempotencyKey) {
        return this.idempotency.execute({
            operation: 'WHAT_IF_EXPLORE',
            key: idempotencyKey,
            userId: user.id,
            requestBody: dto,
        }, async () => {
            const { session, assumptions } = await this.whatIf.explore({
                user,
                challengeId: dto.challengeId,
                question: dto.question,
            });
            return { ...scenario_dtos_1.WhatIfView.from(session, assumptions) };
        });
    }
    async readWhatIf(user, sessionId) {
        const { session, assumptions } = await this.whatIf.findOwnedSession(user, sessionId);
        return scenario_dtos_1.WhatIfView.from(session, assumptions);
    }
    async discardWhatIf(user, sessionId) {
        await this.whatIf.discard(user, sessionId);
        return { discarded: true };
    }
};
exports.ZunoScenarioController = ZunoScenarioController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Generate the scenario set for a challenge' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scenario set produced.' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'The challenge is not understood yet.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Intelligence layer unavailable.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        scenario_dtos_1.GenerateScenariosDto, String]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Read the current scenario set for a challenge' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The current set, or null.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        scenario_dtos_1.ListScenariosQueryDto]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':scenarioId/decision'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Record the user\'s decision about a path' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version, or illegal transition.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('scenarioId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, scenario_dtos_1.ScenarioDecisionDto]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)(':scenarioId/triggered'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Record that this path has become reality' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Stale version, or illegal transition.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('scenarioId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String, scenario_dtos_1.ScenarioTriggeredDto]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "triggered", null);
__decorate([
    (0, common_1.Post)('what-if'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Explore a hypothetical without changing anything' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hypothetical preview.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Blocked by the safety policy.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser,
        scenario_dtos_1.WhatIfRequestDto, String]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "explore", null);
__decorate([
    (0, common_1.Get)('what-if/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Read a hypothetical exploration' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found, expired, or not yours.' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "readWhatIf", null);
__decorate([
    (0, common_1.Delete)('what-if/:sessionId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Discard a hypothetical exploration' }),
    __param(0, (0, zuno_user_decorator_1.CurrentZunoUser)()),
    __param(1, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [zuno_user_entity_1.ZunoUser, String]),
    __metadata("design:returntype", Promise)
], ZunoScenarioController.prototype, "discardWhatIf", null);
exports.ZunoScenarioController = ZunoScenarioController = __decorate([
    (0, swagger_1.ApiTags)('ZUNO - Scenarios & What-If'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('scenarios'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, zuno_user_guard_1.ZunoUserGuard),
    (0, common_1.UseInterceptors)(zuno_response_interceptor_1.ZunoResponseInterceptor),
    (0, common_1.UseFilters)(zuno_exception_filter_1.ZunoExceptionFilter),
    __metadata("design:paramtypes", [scenario_service_1.ScenarioService,
        what_if_service_1.WhatIfService,
        idempotency_service_1.IdempotencyService])
], ZunoScenarioController);
//# sourceMappingURL=scenario.controller.js.map