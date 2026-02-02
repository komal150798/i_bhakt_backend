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

/**
 * Split full name into first name and last name
 * Splits on the first space - everything before first space is first_name,
 * everything after is last_name
 * 
 * @param fullName - Full name string to split
 * @returns Object with first_name and last_name
 * 
 * @example
 * splitFullName('John Doe') // { first_name: 'John', last_name: 'Doe' }
 * splitFullName('John') // { first_name: 'John', last_name: '' }
 * splitFullName('John Michael Doe') // { first_name: 'John', last_name: 'Michael Doe' }
 */
export function splitFullName(fullName: string | null | undefined): { first_name: string; last_name: string } {
  if (!fullName || !fullName.trim()) {
    return { first_name: '', last_name: '' };
  }
  
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  
  if (spaceIndex === -1) {
    // No space found, entire string is first name
    return { first_name: trimmed, last_name: '' };
  }
  
  return {
    first_name: trimmed.substring(0, spaceIndex).trim(),
    last_name: trimmed.substring(spaceIndex + 1).trim(),
  };
}




