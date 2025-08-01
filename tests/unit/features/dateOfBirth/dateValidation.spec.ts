/**
 * Date Validation Tests - Priority-based validation system
 * 
 * Tests the simplified validation system that uses priority-based filtering
 * to show only the highest priority errors while allowing multiple errors
 * of the same priority level (e.g., multiple missing field errors).
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { formatValidationErrors } from '#src/middlewares/dateValidation.js';

interface ValidationError {
  msg: string;
  path?: string;
  value?: unknown;
  location?: string;
}

describe('Date of Birth Validation', () => {
  describe('Priority-based Error Filtering', () => {
    
    describe('Multiple missing field errors (same priority)', () => {
      it('should allow multiple missing field errors to be displayed together', () => {
        // Simulate scenario where day and month are missing but year is provided
        const errors: ValidationError[] = [
          { msg: 'Date of birth must include a day', path: 'dateOfBirth-day' },
          { msg: 'Date of birth must include a month', path: 'dateOfBirth-month' }
        ];
        
        const result = formatValidationErrors(errors);
        
        // Both errors should be present since they're the same priority
        expect(result.errorSummaryList).to.have.length(2);
        expect(result.errorSummaryList[0].text).to.equal('Date of birth must include a day');
        expect(result.errorSummaryList[1].text).to.equal('Date of birth must include a month');
        expect(result.formIsInvalid).to.be.true;
        
        // Input errors should contain both fields
        expect(result.inputErrors).to.have.property('dateOfBirth-day');
        expect(result.inputErrors).to.have.property('dateOfBirth-month');
      });
      
      it('should show all three missing field errors when only format errors exist but no fields provided', () => {
        // Edge case: all fields missing individual validation
        const errors: ValidationError[] = [
          { msg: 'Date of birth must include a day', path: 'dateOfBirth-day' },
          { msg: 'Date of birth must include a month', path: 'dateOfBirth-month' },
          { msg: 'Date of birth must include a year', path: 'dateOfBirth-year' }
        ];
        
        const result = formatValidationErrors(errors);
        
        // All three errors should be present since they're the same priority
        expect(result.errorSummaryList).to.have.length(3);
        expect(result.formIsInvalid).to.be.true;
      });
    });
    
    describe('Single highest priority error (different priority levels)', () => {
      it('should show only the highest priority error when multiple priority levels exist', () => {
        // Simulate scenario with both missing field and format errors
        const errors: ValidationError[] = [
          { msg: 'Date of birth must include a day', path: 'dateOfBirth-day' }, // Priority 5
          { msg: 'Month must be a number between 1 and 12', path: 'dateOfBirth-month' }, // Priority 11
          { msg: 'Year must be a 4-digit number', path: 'dateOfBirth-year' } // Priority 12
        ];
        
        const result = formatValidationErrors(errors);
        
        // Only the missing day error should be shown (highest priority)
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Date of birth must include a day');
        expect(result.formIsInvalid).to.be.true;
        
        // Only the day field should have an error
        expect(result.inputErrors).to.have.property('dateOfBirth-day');
        expect(result.inputErrors).to.not.have.property('dateOfBirth-month');
        expect(result.inputErrors).to.not.have.property('dateOfBirth-year');
      });
      
      it('should prioritize missing all fields over individual missing fields', () => {
        // Simulate scenario with both "all missing" and individual missing field errors
        const errors: ValidationError[] = [
          { msg: 'Enter the date of birth', path: 'dateOfBirth-day' }, // Priority 1
          { msg: 'Date of birth must include a day', path: 'dateOfBirth-day' }, // Priority 5
          { msg: 'Date of birth must include a month', path: 'dateOfBirth-month' } // Priority 6
        ];
        
        const result = formatValidationErrors(errors);
        
        // Only the "Enter the date of birth" error should be shown (highest priority)
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Enter the date of birth');
        expect(result.formIsInvalid).to.be.true;
      });
      
      it('should prioritize format errors over business logic errors', () => {
        // Simulate scenario with both format and business logic errors
        const errors: ValidationError[] = [
          { msg: 'Day must be a number between 1 and 31', path: 'dateOfBirth-day' }, // Priority 10
          { msg: 'Date of birth must be a real date', path: 'dateOfBirth-day' }, // Priority 20
          { msg: 'Date of birth must be today or in the past', path: 'dateOfBirth-day' } // Priority 21
        ];
        
        const result = formatValidationErrors(errors);
        
        // Only the format error should be shown (highest priority)
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Day must be a number between 1 and 31');
        expect(result.formIsInvalid).to.be.true;
      });

      it('should prioritize business logic errors over unchanged validation', () => {
        // Simulate scenario with both business logic and unchanged errors
        const errors: ValidationError[] = [
          { msg: 'Date of birth must be a real date', path: 'dateOfBirth-day' }, // Priority 20
          { msg: 'Date of birth must be today or in the past', path: 'dateOfBirth-day' }, // Priority 21
          { msg: 'Enter the date of birth, or select \'Cancel\'', path: 'dateOfBirth-day' } // Priority 22
        ];
        
        const result = formatValidationErrors(errors);
        
        // Only the real date error should be shown (highest priority)
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Date of birth must be a real date');
        expect(result.formIsInvalid).to.be.true;
      });

      it('should show unchanged validation when it is the only error', () => {
        // Simulate scenario where user hasn't changed the date (AC6)
        const errors: ValidationError[] = [
          { msg: 'Enter the date of birth, or select \'Cancel\'', path: 'dateOfBirth-day' } // Priority 22
        ];
        
        const result = formatValidationErrors(errors);
        
        // The unchanged error should be shown
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Enter the date of birth, or select \'Cancel\'');
        expect(result.errorSummaryList[0].href).to.equal('#dateOfBirth-day');
        expect(result.formIsInvalid).to.be.true;
        
        // Input error should be set correctly
        expect(result.inputErrors).to.have.property('dateOfBirth-day');
        expect(result.inputErrors['dateOfBirth-day'].text).to.equal('Enter the date of birth, or select \'Cancel\'');
      });
    });
    
    describe('Edge cases', () => {
      it('should handle empty error array', () => {
        const errors: ValidationError[] = [];
        
        const result = formatValidationErrors(errors);
        
        expect(result.errorSummaryList).to.have.length(0);
        expect(result.formIsInvalid).to.be.false;
        expect(Object.keys(result.inputErrors)).to.have.length(0);
      });
      
      it('should handle single error without filtering', () => {
        const errors: ValidationError[] = [
          { msg: 'Day must be a number between 1 and 31', path: 'dateOfBirth-day' }
        ];
        
        const result = formatValidationErrors(errors);
        
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Day must be a number between 1 and 31');
        expect(result.formIsInvalid).to.be.true;
      });
      
      it('should handle unknown error messages by treating them as lowest priority', () => {
        const errors: ValidationError[] = [
          { msg: 'Unknown error message', path: 'dateOfBirth-day' }, // Unknown priority (99)
          { msg: 'Day must be a number between 1 and 31', path: 'dateOfBirth-day' } // Priority 10
        ];
        
        const result = formatValidationErrors(errors);
        
        // The known format error should be prioritized over unknown error
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Day must be a number between 1 and 31');
        expect(result.formIsInvalid).to.be.true;
      });
    });
  });
});
