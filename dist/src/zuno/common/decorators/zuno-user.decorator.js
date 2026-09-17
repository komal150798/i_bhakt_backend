"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentZunoUser = void 0;
const common_1 = require("@nestjs/common");
const zuno_user_guard_1 = require("../guards/zuno-user.guard");
const zuno_exception_1 = require("../errors/zuno.exception");
exports.CurrentZunoUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request[zuno_user_guard_1.ZUNO_USER_REQUEST_KEY];
    if (!user) {
        throw zuno_exception_1.ZunoException.internal('CurrentZunoUser used without ZunoUserGuard on the route');
    }
    return user;
});
//# sourceMappingURL=zuno-user.decorator.js.map