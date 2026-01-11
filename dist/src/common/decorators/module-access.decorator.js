"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleAccess = exports.MODULE_SLUG_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MODULE_SLUG_KEY = 'module_slug';
const ModuleAccess = (moduleSlug) => (0, common_1.SetMetadata)(exports.MODULE_SLUG_KEY, moduleSlug);
exports.ModuleAccess = ModuleAccess;
//# sourceMappingURL=module-access.decorator.js.map