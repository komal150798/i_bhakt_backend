/**
 * String utility functions
 * Common string manipulation and formatting helpers
 */

/**
 * Format full name from first and last name
 * Handles null/undefined values gracefully
 * 
 * @param firstName - First name (can be null/undefined)
 * @param lastName - Last name (can be null/undefined)
 * @param fallback - Fallback text if both names are empty (default: 'User')
 * @returns Formatted full name or fallback
 * 
 * @example
 * formatFullName('John', 'Doe') // 'John Doe'
 * formatFullName('John', null) // 'John'
 * formatFullName(null, null) // 'User'
 * formatFullName(null, null, 'Guest') // 'Guest'
 */
export function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string = 'User',
): string {
  const parts: string[] = [];
  
  if (firstName) parts.push(firstName);
  if (lastName) parts.push(lastName);
  
  const fullName = parts.join(' ').trim();
  return fullName || fallback;
}

/**
 * Safely trim a string
 * Returns empty string if value is null/undefined
 * 
 * @param value - String value to trim
 * @returns Trimmed string or empty string
 */
export function safeTrim(value: string | null | undefined): string {
  return value?.trim() || '';
}

/**
 * Check if a string is empty or whitespace
 * 
 * @param value - String value to check
 * @returns True if string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Capitalize first letter of a string
 * 
 * @param value - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(value: string | null | undefined): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}


