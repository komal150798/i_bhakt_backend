"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZunoException = void 0;
const common_1 = require("@nestjs/common");
const error_codes_enum_1 = require("./error-codes.enum");
class ZunoException extends common_1.HttpException {
    constructor(code, options = {}) {
        const body = {
            code,
            message: options.message ?? error_codes_enum_1.ZUNO_ERROR_DEFAULT_MESSAGE[code],
            ...(options.fields ? { fields: options.fields } : {}),
            ...(options.safety ? { safety: options.safety } : {}),
        };
        super({ error: body }, error_codes_enum_1.ZUNO_ERROR_HTTP_STATUS[code]);
        this.code = code;
        this.fields = options.fields;
        this.safety = options.safety;
        this.internalDetail = options.internalDetail;
    }
    static validation(fields, message) {
        return new ZunoException(error_codes_enum_1.ZunoErrorCode.VALIDATION_ERROR, { fields, message });
    }
    static notFound(internalDetail) {
        return new ZunoException(error_codes_enum_1.ZunoErrorCode.NOT_FOUND, { internalDetail });
    }
    static staleVersion(expected, actual) {
        return new ZunoException(error_codes_enum_1.ZunoErrorCode.CONFLICT, {
            internalDetail: `optimistic lock: client sent version ${expected}, server at ${actual}`,
        });
    }
    static internal(internalDetail) {
        return new ZunoException(error_codes_enum_1.ZunoErrorCode.INTERNAL_ERROR, { internalDetail });
    }
}
exports.ZunoException = ZunoException;
//# sourceMappingURL=zuno.exception.js.map