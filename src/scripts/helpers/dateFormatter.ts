/**
 * Date Formatting Helpers
 *
 * Utility functions for formatting dates in a consistent way across the application.
 */

import moment from 'moment';
import { ZERO_PADDING_LENGTH, MONTH_INDEX_OFFSET } from '#src/constants/dateConstants.js';

/**
 * Format date for display in table cells and UI components
 * @param {string} dateString ISO date string
 * @returns {string} Formatted date in D MMM YYYY format (e.g., "6 Jan 1986")
 * @throws {Error} If dateString is not a valid ISO date
 */
export function formatDate(dateString: string): string {
  const date = moment(dateString);
  if (!date.isValid()) {
    throw new Error(`Invalid ISO date string received: "${dateString}". Expected format: YYYY-MM-DD`);
  }
  
  return date.format('D MMM YYYY');
}

/**
 * Format date components to ISO YYYY-MM-DD format for API calls
 * @param {string} day Day component
 * @param {string} month Month component  
 * @param {string} year Year component
 * @returns {string} ISO formatted date string
 * @throws {Error} If the resulting date is invalid
 */
export function formatDateForApi(day: string, month: string, year: string): string {
  // Use moment to create and format the date
  const isoString = `${year}-${month.padStart(ZERO_PADDING_LENGTH, '0')}-${day.padStart(ZERO_PADDING_LENGTH, '0')}`;
  const date = moment(isoString);
  
  if (!date.isValid()) {
    throw new Error(`Invalid date components received: day="${day}", month="${month}", year="${year}". Components should already be validated.`);
  }
  
  return date.format('YYYY-MM-DD');
}



/**
 * Parse ISO date string to form components
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {{ day: string, month: string, year: string }} Form components
 * @throws {Error} If dateString is not a valid ISO date
 */
export function parseIsoDateToForm(dateString: string): { day: string, month: string, year: string } {
  if (dateString === '' || typeof dateString !== 'string') {
    throw new Error(`Invalid dateString received: "${dateString}". Expected non-empty ISO date string.`);
  }

  // Parse with moment for ISO dates
  const date = moment(dateString);
  
  if (!date.isValid()) {
    throw new Error(`Invalid ISO date string received: "${dateString}". Expected format: YYYY-MM-DD`);
  }
  
  return {
    day: date.date().toString(),
    month: (date.month() + MONTH_INDEX_OFFSET).toString(), // moment months are 0-based
    year: date.year().toString()
  };
}
