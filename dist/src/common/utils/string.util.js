"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFullName = formatFullName;
exports.safeTrim = safeTrim;
exports.isEmpty = isEmpty;
exports.capitalize = capitalize;
exports.splitFullName = splitFullName;
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
function splitFullName(fullName) {
    if (!fullName || !fullName.trim()) {
        return { first_name: '', last_name: '' };
    }
    const trimmed = fullName.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
        return { first_name: trimmed, last_name: '' };
    }
    return {
        first_name: trimmed.substring(0, spaceIndex).trim(),
        last_name: trimmed.substring(spaceIndex + 1).trim(),
    };
}
//# sourceMappingURL=string.util.js.map