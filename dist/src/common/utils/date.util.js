"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateToISO = formatDateToISO;
exports.parseDateString = parseDateString;
exports.formatDateDDMMYYYY = formatDateDDMMYYYY;
function formatDateToISO(date) {
    if (!date)
        return null;
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        if (date.includes('T')) {
            return date.split('T')[0];
        }
        try {
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }
        }
        catch {
        }
    }
    return null;
}
function parseDateString(dateString) {
    if (!dateString)
        return null;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    }
    catch {
        return null;
    }
}
function formatDateDDMMYYYY(date) {
    if (!date)
        return 'N/A';
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return 'N/A';
        }
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    }
    catch {
        return 'N/A';
    }
}
//# sourceMappingURL=date.util.js.map