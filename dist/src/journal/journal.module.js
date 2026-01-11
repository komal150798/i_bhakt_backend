"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const journal_entry_entity_1 = require("./entities/journal-entry.entity");
const journal_service_1 = require("./journal.service");
const app_journal_controller_1 = require("./controllers/app-journal.controller");
const karma_module_1 = require("../karma/karma.module");
const constants_module_1 = require("../common/constants/constants.module");
let JournalModule = class JournalModule {
};
exports.JournalModule = JournalModule;
exports.JournalModule = JournalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([journal_entry_entity_1.JournalEntry]),
            karma_module_1.KarmaModule,
            constants_module_1.ConstantsModule,
        ],
        controllers: [app_journal_controller_1.AppJournalController],
        providers: [journal_service_1.JournalService],
        exports: [journal_service_1.JournalService],
    })
], JournalModule);
//# sourceMappingURL=journal.module.js.map