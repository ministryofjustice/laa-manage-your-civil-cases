/**
 * Date Testing Helper Functions
 * 
 * Eliminates Arrange-Act-Assert repetition across date formatting and validation tests.
 * Provides consistent error reporting and test data management.
 */

import { expect } from 'chai';
import { formatDateForApi, parseIsoDateToForm } from '#src/scripts/helpers/dateFormatter.js';

/**
 * Test case interface for validation tests
 */
export interface DateTestCase {
  day: string;
  month: string;
  year: string;
  expected: string | null;
  description: string;
}

/**
 * Helper to test successful date parsing from ISO format
 * @param {string} isoString - ISO date string to parse
 * @param {object} expected - Expected parsed result
 * @param {string} expected.day - Expected day value
 * @param {string} expected.month - Expected month value
 * @param {string} expected.year - Expected year value
 * @returns {void}
 */
export function expectParsedDate(isoString: string, expected: { day: string; month: string; year: string }): void {
  const result = parseIsoDateToForm(isoString);
  expect(result).to.deep.equal(expected);
}

/**
 * Helper to test parsing failure 
 * @param {string} isoString - ISO date string that should fail parsing
 * @returns {void}
 */
export function expectParsingFailure(isoString: string): void {
  expect(() => parseIsoDateToForm(isoString)).to.throw();
}

/**
 * Helper to test date formatting
 * @param {string} day - Day component
 * @param {string} month - Month component
 * @param {string} year - Year component
 * @param {string} expected - Expected formatted result
 * @returns {void}
 */
export function expectFormattedDate(day: string, month: string, year: string, expected: string): void {
  const result = formatDateForApi(day, month, year);
  expect(result).to.equal(expected, `Failed to format date: ${day}/${month}/${year}`);
}

/**
 * Create date test data with overrides
 * @param {Record<string, string>} [overrides] - Override values for default test data
 * @returns {Record<string, string>} Combined test data object
 */
export function createDateTestData(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    dayOfBirth: '15',
    monthOfBirth: '6',
    yearOfBirth: '1990',
    ...overrides
  };
}
