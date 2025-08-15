import { expect } from 'chai';
import { 
  parseDateString,
  extractDateFormData,
  extractOriginalDateData,
  prioritizeValidationErrors,
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

  describe('prioritizeValidationErrors', () => {
    it('should throw error for empty array', () => {
      expect(() => prioritizeValidationErrors([])).to.throw('Cannot prioritize empty error array');
    });

    it('should return single error unchanged', () => {
      const error: ValidationErrorData = {
        summaryMessage: 'Test error',
        inlineMessage: 'Test inline'
      };
      
      const result = prioritizeValidationErrors([error]);
      expect(result).to.equal(error);
    });

    it('should prioritize CRITICAL errors over IMPORTANT', () => {
      const criticalError: ValidationErrorData = {
        summaryMessage: 'Enter the client date of birth',
        inlineMessage: 'Required field'
      };
      
      const importantError: ValidationErrorData = {
        summaryMessage: 'Year must include 4 numbers',
        inlineMessage: 'Format error'
      };
      
      const result = prioritizeValidationErrors([importantError, criticalError]);
      expect(result).to.equal(criticalError);
    });

    it('should prioritize IMPORTANT errors over STANDARD', () => {
      const importantError: ValidationErrorData = {
        summaryMessage: 'Day must be a number',
        inlineMessage: 'Format error'
      };
      
      const standardError: ValidationErrorData = {
        summaryMessage: 'Date must be valid',
        inlineMessage: 'Logic error'
      };
      
      const result = prioritizeValidationErrors([standardError, importantError]);
      expect(result).to.equal(importantError);
    });

    it('should classify CRITICAL priority correctly', () => {
      const criticalMessages = [
        'Enter the client date of birth',
        'Update the client information',
        'Select \'cancel\' to return',
        'Day is required',
        'Date of birth is required'
      ];
      
      criticalMessages.forEach(message => {
        const criticalError: ValidationErrorData = {
          summaryMessage: message,
          inlineMessage: 'Test'
        };
        
        const standardError: ValidationErrorData = {
          summaryMessage: 'Some other error',
          inlineMessage: 'Standard'
        };
        
        const result = prioritizeValidationErrors([standardError, criticalError]);
        expect(result).to.equal(criticalError);
      });
    });

    it('should classify IMPORTANT priority correctly', () => {
      const importantMessages = [
        'Year must include 4 numbers',
        'Day must be between 1 and 31',
        'Date must be in the past',
        'Month must be a number'
      ];
      
      importantMessages.forEach(message => {
        const importantError: ValidationErrorData = {
          summaryMessage: message,
          inlineMessage: 'Test'
        };
        
        const standardError: ValidationErrorData = {
          summaryMessage: 'Some other error',
          inlineMessage: 'Standard'
        };
        
        const result = prioritizeValidationErrors([standardError, importantError]);
        expect(result).to.equal(importantError);
      });
    });

    it('should handle inline message classification for IMPORTANT errors', () => {
      const importantError: ValidationErrorData = {
        summaryMessage: 'Generic error',
        inlineMessage: 'Must be a number'
      };
      
      const standardError: ValidationErrorData = {
        summaryMessage: 'Another error',
        inlineMessage: 'Standard'
      };
      
      const result = prioritizeValidationErrors([standardError, importantError]);
      expect(result).to.equal(importantError);
    });

    it('should default to STANDARD priority for unmatched messages', () => {
      const standardError1: ValidationErrorData = {
        summaryMessage: 'Unknown error type',
        inlineMessage: 'Test'
      };
      
      const standardError2: ValidationErrorData = {
        summaryMessage: 'Another unknown error',
        inlineMessage: 'Test'
      };
      
      // Should return first error when both have same priority
      const result = prioritizeValidationErrors([standardError1, standardError2]);
      expect(result).to.equal(standardError1);
    });
  });
});
