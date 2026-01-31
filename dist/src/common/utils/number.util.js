"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.toInteger = toInteger;
exports.isValidNumber = isValidNumber;
function toNumber(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    return null;
}
function toInteger(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number')
        return Math.floor(value);
    if (typeof value === 'string') {
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;
    }
    return null;
}
function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
//# sourceMappingURL=number.util.js.map