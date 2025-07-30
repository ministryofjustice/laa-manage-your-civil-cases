import { describe, it } from 'mocha';
import { expect } from 'chai';
import { validateForm } from '#src/scripts/helpers/validateForm.js';
import { getValidatedFormResult } from '#src/scripts/helpers/formValidationRules.js';
import type { ValidationFields } from '#types/form-validation.js';

describe('Validate Form', () => {
  describe('validateForm', () => {
    describe('Valid Form Scenarios', () => {
      it('should return no errors for valid name change', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.false;
        expect(result.inputErrors).to.be.empty;
        expect(result.errorSummaryList).to.be.empty;
      });

      it('should return no errors for valid email change', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmail: 'jane@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.false;
        expect(result.inputErrors).to.be.empty;
        expect(result.errorSummaryList).to.be.empty;
      });

      it('should return no errors for valid combined form', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe',
          emailAddress: 'john@example.com',
          existingEmail: 'jane@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.false;
        expect(result.inputErrors).to.be.empty;
        expect(result.errorSummaryList).to.be.empty;
      });
    });

    describe('Invalid Form Scenarios', () => {
      it('should return error for empty name', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: 'Jane Doe'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('fullName');
        expect(result.inputErrors.fullName).to.equal('Enter the client name');
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0].text).to.equal('Enter the client name');
        expect(result.errorSummaryList[0].href).to.equal('#fullName');
      });

      it('should return error for unchanged name', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'John Doe'
        };
        
        const result = validateForm(fields);
        const validationRules = getValidatedFormResult(fields);
        const unchangedRule = validationRules.find(rule => 
          rule.isInvalid && rule.inputError?.fieldName === 'fullName' && 
          rule.errorSummary.text.includes('Cancel')
        );
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('fullName');
        expect(result.inputErrors.fullName).to.equal(unchangedRule?.inputError?.text);
        expect(result.errorSummaryList).to.have.length(1);
      });

      it('should return error for unchanged email', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmail: 'john@example.com'
        };
        
        const result = validateForm(fields);
        const validationRules = getValidatedFormResult(fields);
        const unchangedRule = validationRules.find(rule => 
          rule.isInvalid && rule.inputError?.fieldName === 'emailAddress' && 
          rule.errorSummary.text.includes('Cancel')
        );
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('emailAddress');
        expect(result.inputErrors.emailAddress).to.equal(unchangedRule?.inputError?.text);
        expect(result.errorSummaryList).to.have.length(1);
      });

      it('should return error for invalid email format', () => {
        const fields: ValidationFields = {
          emailAddress: 'invalid-email',
          existingEmail: 'valid@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('emailAddress');
        expect(result.inputErrors.emailAddress).to.equal('Enter an email address in the correct format, like name@example.com');
        expect(result.errorSummaryList).to.have.length(1);
      });
    });

    describe('Multiple Error Scenarios', () => {
      it('should return multiple errors for multiple invalid fields', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: 'Jane Doe',
          emailAddress: 'invalid-email',
          existingEmail: 'valid@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('fullName');
        expect(result.inputErrors).to.have.property('emailAddress');
        expect(result.errorSummaryList.length).to.be.greaterThan(1);
      });

      it('should handle prioritized errors correctly', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'John Doe',
          emailAddress: 'john@example.com',
          existingEmail: 'john@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('fullName');
        expect(result.inputErrors).to.have.property('emailAddress');
        expect(result.errorSummaryList).to.have.length(2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty fields object', () => {
        const fields: ValidationFields = {};
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.false;
        expect(result.inputErrors).to.be.empty;
        expect(result.errorSummaryList).to.be.empty;
      });

      it('should handle partial field data', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe'
          // Missing existingFullName
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.false;
        expect(result.inputErrors).to.be.empty;
        expect(result.errorSummaryList).to.be.empty;
      });

      it('should handle whitespace-only name', () => {
        const fields: ValidationFields = {
          fullName: '   ',
          existingFullName: 'Jane Doe'
        };
        
        const result = validateForm(fields);
        
        expect(result.formIsInvalid).to.be.true;
        expect(result.inputErrors).to.have.property('fullName');
        expect(result.inputErrors.fullName).to.equal('Enter the client name');
      });
    });

    describe('Return Structure Validation', () => {
      it('should always return the correct object structure', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe'
        };
        
        const result = validateForm(fields);
        
        expect(result).to.have.property('inputErrors');
        expect(result).to.have.property('errorSummaryList');
        expect(result).to.have.property('formIsInvalid');
        expect(result.inputErrors).to.be.an('object');
        expect(result.errorSummaryList).to.be.an('array');
        expect(result.formIsInvalid).to.be.a('boolean');
      });

      it('should ensure errorSummaryList items have correct structure', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: 'Jane Doe'
        };
        
        const result = validateForm(fields);
        
        expect(result.errorSummaryList).to.have.length(1);
        expect(result.errorSummaryList[0]).to.have.property('text');
        expect(result.errorSummaryList[0]).to.have.property('href');
        expect(result.errorSummaryList[0].text).to.be.a('string');
        expect(result.errorSummaryList[0].href).to.be.a('string');
      });

      it('should ensure inputErrors values are strings', () => {
        const fields: ValidationFields = {
          emailAddress: 'invalid-email',
          existingEmail: 'valid@example.com'
        };
        
        const result = validateForm(fields);
        
        expect(result.inputErrors.emailAddress).to.be.a('string');
        expect(result.inputErrors.emailAddress.length).to.be.greaterThan(0);
      });
    });
  });
});
