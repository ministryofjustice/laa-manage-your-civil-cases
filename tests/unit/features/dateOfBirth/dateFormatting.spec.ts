/**
 * Date Formatting Tests
 * 
 * Comprehensive testing of date formatting and parsing logic.
 * Covers API format conversion, display parsing, and database compliance.
 * 
 * Note: Date validation is tested separately in middleware tests.
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { 
  formatDate, 
  formatDateForApi, 
  parseIsoDateToForm 
} from '#src/scripts/helpers/dateFormatter.js';
import { 
  expectParsedDate, 
  expectParsingFailure, 
  expectFormattedDate
} from '../../../helpers/dateTestHelpers.js';

describe('Date Formatting', () => {
  describe('formatDate - Display Formatting', () => {
    it('should format ISO date to display format', () => {
      const result = formatDate('2025-07-28');
      expect(result).to.equal('28 Jul 2025');
    });

    it('should handle datetime strings', () => {
      const result = formatDate('2025-07-28T14:30:00Z');
      expect(result).to.equal('28 Jul 2025');
    });

    it('should throw error on invalid date', () => {
      expect(() => formatDate('invalid-date')).to.throw('Invalid ISO date string received: "invalid-date". Expected format: YYYY-MM-DD');
    });
  });

  describe('formatDateForApi - ISO Format Conversion', () => {
    it('should format day/month/year to ISO YYYY-MM-DD', () => {
      expectFormattedDate('15', '3', '1987', '1987-03-15');
    });

    it('should pad single digit day and month', () => {
      expectFormattedDate('5', '7', '2025', '2025-07-05');
    });

    it('should handle already padded values', () => {
      expectFormattedDate('15', '12', '1990', '1990-12-15');
    });
  });

  describe('parseIsoDateToForm - ISO to Form Components', () => {
    describe('ISO Date Format Parsing', () => {
      it('should parse ISO date format YYYY-MM-DD', () => {
        expectParsedDate('2025-07-28', {
          day: '28',
          month: '7',
          year: '2025'
        });
      });

      it('should parse ISO datetime format', () => {
        expectParsedDate('2025-07-28T14:30:00', {
          day: '28',
          month: '7',
          year: '2025'
        });
      });

      it('should remove leading zeros', () => {
        expectParsedDate('2025-01-05', {
          day: '5',
          month: '1',
          year: '2025'
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw errors for invalid inputs', () => {
        expectParsingFailure('');
        expectParsingFailure('invalid-date-format');
        expectParsingFailure(null as any);
        expectParsingFailure(undefined as any);
      });

      it('should throw error for invalid month names', () => {
        expectParsingFailure('15 InvalidMonth 2025');
      });
    });
  });

  describe('Database Compliance', () => {
    describe('API Data Format Compliance - YYYY-MM-DD', () => {
      it('should format for legalaid_personaldetails.date_of_birth field', () => {
        const result = formatDateForApi('15', '3', '1987');
        expect(result).to.equal('1987-03-15');
      });

      it('should pad single digits for ISO compliance', () => {
        const result = formatDateForApi('8', '7', '1995');
        expect(result).to.equal('1995-07-08');
      });
    });

    describe('Data Transformation Round-Trip', () => {
      it('should maintain data integrity through display → API → display', () => {
        const originalDay = '27';
        const originalMonth = '3';
        const originalYear = '1987';
        
        // Transform to API format and back
        const apiFormat = formatDateForApi(originalDay, originalMonth, originalYear);
        const backToDisplay = parseIsoDateToForm(apiFormat);
        
        expect(apiFormat).to.equal('1987-03-27');
        expect(backToDisplay).to.not.be.null;
        expect(backToDisplay!.day).to.equal(originalDay);
        expect(backToDisplay!.month).to.equal(originalMonth);
        expect(backToDisplay!.year).to.equal(originalYear);
      });

      it('should handle single digit components through transformation', () => {
        const originalDay = '5';
        const originalMonth = '1';
        const originalYear = '1992';
        
        const apiFormat = formatDateForApi(originalDay, originalMonth, originalYear);
        const backToDisplay = parseIsoDateToForm(apiFormat);
        
        expect(apiFormat).to.equal('1992-01-05');
        expect(backToDisplay!.day).to.equal(originalDay);
        expect(backToDisplay!.month).to.equal(originalMonth);
        expect(backToDisplay!.year).to.equal(originalYear);
      });
    });
  });
});
