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
  // Intl.DateTimeFormat handles BST for us
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  return `${datePart}`;
}

/**
 * Format date for display in table cells and UI components, where it needs to be have the month displayed in full
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MMMM YYYY format (e.g., "6 January 1986")
 */
export function formatDateLongMonth(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  // Intl.DateTimeFormat handles BST for us
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return `${datePart}`;
}

/**
 * Format date in long format
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MMM YYYY H:MMam/pm format (e.g., "6 January 1986 at 2:01pm")
 */
export function formatLongFormDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  // Intl.DateTimeFormat handles BST for us
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(' am', 'am')
    .replace(' pm', 'pm')
    .replace('\u202Fam', 'am')
    .replace('\u202Fpm', 'pm');
  
  return `${datePart} at ${timePart}`;
}

/**
 * Format date in long format, but short Month
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MM YYYY H:MMam/pm format (e.g., "6 Jan 1986 at 2:01pm")
 */
export function formatLongFormDateWithShortMonth(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  // Intl.DateTimeFormat handles BST for us
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(' am', 'am')
    .replace(' pm', 'pm')
    .replace('\u202Fam', 'am')
    .replace('\u202Fpm', 'pm');
  
  return `${datePart} at ${timePart}`;
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
