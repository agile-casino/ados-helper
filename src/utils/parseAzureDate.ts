/**
 * Parses date strings from Azure DevOps API responses.
 * 
 * Supports two formats:
 * 1. Azure DevOps legacy format: /Date(1234567890123)/
 * 2. ISO 8601 format: 2026-01-27T10:30:00Z
 * 
 * @param dateStr - The date string to parse, or undefined
 * @returns A valid Date object, or null if parsing fails or input is undefined
 * 
 * @example
 * parseAzureDate('/Date(1764079201133)/') // Returns Date object
 * parseAzureDate('2026-01-27T10:30:00Z')  // Returns Date object
 * parseAzureDate(undefined)                // Returns null
 * parseAzureDate('invalid')                // Returns null
 */
export function parseAzureDate(dateStr: string | undefined): Date | null {
  if (!dateStr) {
    return null;
  }

  // Try Azure DevOps legacy format: /Date(1234567890123)/
  const azureMatch = dateStr.match(/^\/Date\((\d+)\)\/$/);
  if (azureMatch) {
    const timestamp = Number.parseInt(azureMatch[1], 10);
    
    // Validate timestamp is reasonable (between year 1970 and year 2100)
    const minTimestamp = 0; // Jan 1, 1970
    const maxTimestamp = 4102444800000; // Jan 1, 2100
    
    if (timestamp >= minTimestamp && timestamp <= maxTimestamp) {
      const date = new Date(timestamp);
      // Double-check the created date is valid
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  }

  // Try standard ISO 8601 or other date format parsing
  try {
    const date = new Date(dateStr);
    
    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    
    // Additional validation: ensure the year is reasonable
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}
