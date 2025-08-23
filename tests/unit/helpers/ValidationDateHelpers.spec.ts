import { expect } from 'chai';
import {
  parseDateString,
  extractDateFormData,
  extractOriginalDateData,
  type DateFormData
} from '#src/scripts/helpers/ValidationDateHelpers.js';
import type { ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';

describe('ValidationDateHelpers', () => {
  describe('parseDateString', () => {
    it('should parse valid ISO date string correctly', () => {
      const result = parseDateString('1990-05-15');
      expect(result).to.deep.equal({
        day: '15',
        month: '5',
        year: '1990'
      });
    });

    it('should return empty strings for invalid date', () => {
      const result = parseDateString('invalid-date');
      expect(result).to.deep.equal({
        day: '',
        month: '',
        year: ''
      });
    });

    it('should return empty strings for empty input', () => {
      const result = parseDateString('');
      expect(result).to.deep.equal({
        day: '',
        month: '',
        year: ''
      });
    });
  });

  describe('extractDateFormData', () => {
    it('should extract date form data from request body', () => {
      const body = {
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '5',
        'dateOfBirth-year': '1990'
      };

      const result = extractDateFormData(body);
      expect(result).to.deep.equal({
        day: '15',
        month: '5',
        year: '1990'
      });
    });

    it('should handle missing fields gracefully', () => {
      const body = {
        'dateOfBirth-day': '15'
        // missing month and year
      };

      const result = extractDateFormData(body);
      expect(result).to.deep.equal({
        day: '15',
        month: '',
        year: ''
      });
    });
  });

  describe('extractOriginalDateData', () => {
    it('should extract original date data from request body', () => {
      const body = {
        originalDay: '10',
        originalMonth: '3',
        originalYear: '1985'
      };

      const result = extractOriginalDateData(body);
      expect(result).to.deep.equal({
        day: '10',
        month: '3',
        year: '1985'
      });
    });
  });

});
