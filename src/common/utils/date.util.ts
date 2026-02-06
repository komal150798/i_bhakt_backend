/**
 * Date utility functions
 * Common date conversion and formatting helpers
 */

/**
 * Convert a date value (string or Date) to ISO date string (YYYY-MM-DD)
 * Handles both Date objects and string dates
 * 
 * @param date - Date value (Date object or string in YYYY-MM-DD format)
 * @returns ISO date string (YYYY-MM-DD) or the original string if already in correct format
 * 
 * @example
 * formatDateToISO(new Date('2024-01-15')) // '2024-01-15'
 * formatDateToISO('2024-01-15') // '2024-01-15'
 * formatDateToISO('2024-01-15T10:30:00Z') // '2024-01-15'
 */
export function formatDateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // If has time component, extract date part
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    // Try to parse and format
    try {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {
      // Invalid date string
    }
  }
  
  return null;
}

/**
 * Convert a string date to Date object
 * Safely handles string dates from DTOs
 * 
 * @param dateString - Date string (YYYY-MM-DD format)
 * @returns Date object or null if invalid
 * 
 * @example
 * parseDateString('2024-01-15') // Date object
 * parseDateString(null) // null
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Format date to dd/mm/yyyy format
 * 
 * @param date - Date value (Date object or string)
 * @returns Formatted date string (dd/mm/yyyy) or 'N/A' if invalid
 * 
 * @example
 * formatDateDDMMYYYY(new Date('2024-01-15')) // '15/01/2024'
 * formatDateDDMMYYYY('2024-01-15') // '15/01/2024'
 */
export function formatDateDDMMYYYY(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
}





