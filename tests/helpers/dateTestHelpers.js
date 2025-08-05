/**
 * Date Test Helper Functions
 * 
 * Common helper functions for testing date operations across the application.
 * Provides reusable test patterns for validation, formatting, and parsing.
 */

import { expect } from 'chai';
import { 
  formatDate, 
  formatDateForApi, 
  parseIsoDateToForm 
} from '#src/scripts/helpers/dateFormatter.js';

/**
 * Test helper to verify a date is parsed correctly from ISO format
 * @param {string} isoDate - ISO date string to parse
 * @param {object} expected - Expected values {day, month, year}
 */
export function expectParsedDate(isoDate, expected) {
  const result = parseIsoDateToForm(isoDate);
  expect(result.day).to.equal(expected.day);
  expect(result.month).to.equal(expected.month);
  expect(result.year).to.equal(expected.year);
}

/**
 * Test helper to verify date parsing fails for invalid input
 * @param {string} invalidDate - Invalid date string
 */
export function expectParsingFailure(invalidDate) {
  expect(() => parseIsoDateToForm(invalidDate)).to.throw();
}

/**
 * Test helper to verify a date is formatted correctly for API
 * @param {string} day - Day value
 * @param {string} month - Month value
 * @param {string} year - Year value
 * @param {string} expectedFormat - Expected API format
 */
export function expectFormattedDate(day, month, year, expectedFormat) {
  const result = formatDateForApi(day, month, year);
  expect(result).to.equal(expectedFormat);
}


