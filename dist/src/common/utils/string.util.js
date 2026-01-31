"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFullName = formatFullName;
exports.safeTrim = safeTrim;
exports.isEmpty = isEmpty;
exports.capitalize = capitalize;
function formatFullName(firstName, lastName, fallback = 'User') {
    const parts = [];
    if (firstName)
        parts.push(firstName);
    if (lastName)
        parts.push(lastName);
    const fullName = parts.join(' ').trim();
    return fullName || fallback;
}
function safeTrim(value) {
    return value?.trim() || '';
}
function isEmpty(value) {
    return !value || value.trim().length === 0;
}
function capitalize(value) {
    if (!value)
        return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
//# sourceMappingURL=string.util.js.map