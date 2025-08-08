// Utility functions for date formatting

/**
 * Converts a date from YYYY-MM-DD format to DD/MM/YYYY format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date in DD/MM/YYYY format
 */
export const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date to DD/MM/YYYY:', error);
  }
  
  return dateString; // Return original if conversion fails
};

/**
 * Converts a date from DD/MM/YYYY format to YYYY-MM-DD format
 * @param dateString - Date in DD/MM/YYYY format
 * @returns Date in YYYY-MM-DD format
 */
export const formatDateToYYYYMMDD = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [day, month, year] = dateString.split('/');
    if (year && month && day) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error formatting date to YYYY-MM-DD:', error);
  }
  
  return dateString; // Return original if conversion fails
};

/**
 * Gets today's date in DD/MM/YYYY format
 * @returns Today's date in DD/MM/YYYY format
 */
export const getTodayInDDMMYYYY = (): string => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString();
  return `${day}/${month}/${year}`;
};

/**
 * Gets today's date in YYYY-MM-DD format (for HTML date inputs)
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTodayInYYYYMMDD = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a deadline for display (converts from YYYY-MM-DD to DD/MM/YYYY)
 * @param deadline - Deadline in YYYY-MM-DD format
 * @returns Formatted deadline in DD/MM/YYYY format
 */
export const formatDeadlineForDisplay = (deadline: string): string => {
  return formatDateToDDMMYYYY(deadline);
};

/**
 * Formats a deadline for storage (converts from DD/MM/YYYY to YYYY-MM-DD)
 * @param deadline - Deadline in DD/MM/YYYY format
 * @returns Formatted deadline in YYYY-MM-DD format
 */
export const formatDeadlineForStorage = (deadline: string): string => {
  return formatDateToYYYYMMDD(deadline);
};
