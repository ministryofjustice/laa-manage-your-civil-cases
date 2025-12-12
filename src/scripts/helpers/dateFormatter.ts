/**
 * Date Formatting Helpers
 *
 * Utility functions for formatting dates in a consistent way across the application.
 */

// Constants
const DATE_PADDING_WIDTH = 2;
const DATE_PADDING_CHAR = '0';

/**
 * Format date for display in table cells and UI components
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MMM YYYY format (e.g., "6 Jan 1986")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date in long format
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MMM YYYY H:MMam/pm format (e.g., "6 January 1986 at 2:01pm")
 */
export function formatLongFormDate(dateString: string): string {
  const date = new Date(dateString);
  const AM_HOURS = 12;
  const PADDING = 2;
  const ZERO = 0;

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
    
  // Convert to 12-hour format
  let hours = date.getHours();
  const noonOrNot = hours >= AM_HOURS ? "pm" : "am";
  const remainder = hours % AM_HOURS;
  hours = remainder === ZERO ? AM_HOURS : remainder;

  const minutes = date.getMinutes().toString().padStart(PADDING, "0");

  return `${day} ${month} ${year} at ${hours}:${minutes}${noonOrNot}`;
}

/**
 * Constructs a date string in the format 'YYYY-MM-DD' from separate day, month, and year fields.
 * Pads the day and month values to ensure two digits using predefined padding width and character.
 *
 * @param {string} day - The day part of the date as a string (e.g., '1', '09').
 * @param {string} month - The month part of the date as a string (e.g., '2', '11').
 * @param {string} year - The year part of the date as a string (e.g., '2024').
 * @returns {string} The formatted date string in 'YYYY-MM-DD' format.
 */
export function dateStringFromThreeFields(day: string, month: string, year: string): string {
  const paddedMonth = month.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
  const paddedDay = day.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
  return `${year}-${paddedMonth}-${paddedDay}`;
}
