/**
 * Date Formatting Helpers
 *
 * Utility functions for formatting dates in a consistent way across the application.
 */

/**
 * Format date for display in table cells and UI components
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in DD MMM YYYY format (e.g., "06 Jan 1986")
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
