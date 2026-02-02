/**
 * Number utility functions
 * Common number conversion and validation helpers
 */

/**
 * Safely convert a value to a number
 * Handles null, undefined, string, and number types
 * 
 * @param value - Value to convert (can be number, string, null, or undefined)
 * @returns The number value or null if conversion fails
 * 
 * @example
 * toNumber('123.45') // 123.45
 * toNumber(123) // 123
 * toNumber(null) // null
 * toNumber('invalid') // null
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Safely convert a value to an integer
 * 
 * @param value - Value to convert
 * @returns The integer value or null if conversion fails
 */
export function toInteger(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Check if a value is a valid number
 * 
 * @param value - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}




