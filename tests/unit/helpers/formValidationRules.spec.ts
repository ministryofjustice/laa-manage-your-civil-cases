import { describe, it } from 'mocha';
import { expect } from 'chai';
import { getValidatedFormResult } from '#src/scripts/helpers/formValidationRules.js';
import type { ValidationFields } from '#types/form-validation.js';

describe('Form Validation Rules', () => {
  describe('getValidatedFormResult', () => {
    describe('Full Name Validation', () => {
      it('should return empty validation error when fullName is provided and different from existing', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe'
        };
        
        const result = getValidatedFormResult(fields);
        const fullNameErrors = result.filter(rule => rule.isInvalid);
        
        expect(fullNameErrors).to.have.length(0);
      });

      it('should return empty name error when fullName is empty', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: 'Jane Doe'
        };
        
        const result = getValidatedFormResult(fields);
        const emptyNameError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter the client name"
        );
        
        expect(emptyNameError).to.exist;
        expect(emptyNameError?.inputError?.fieldName).to.equal('fullName');
      });

      it('should return unchanged name error when fullName matches existing (including empty)', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'John Doe'
        };
        
        const result = getValidatedFormResult(fields);
        const unchangedNameError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text.includes("Enter the client name, or select") &&
          rule.errorSummary.text.includes("Cancel")
        );
        
        expect(unchangedNameError).to.exist;
        expect(unchangedNameError?.inputError?.fieldName).to.equal('fullName');
      });

      it('should return both empty and unchanged errors when fullName is empty and matches existing empty', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: ''
        };
        
        const result = getValidatedFormResult(fields);
        const emptyNameError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter the client name"
        );
        const unchangedNameError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text.includes("Enter the client name, or select") &&
          rule.errorSummary.text.includes("Cancel")
        );
        
        expect(emptyNameError).to.exist;
        expect(unchangedNameError).to.exist;
      });

      it('should handle whitespace in fullName correctly', () => {
        const fields: ValidationFields = {
          fullName: '   ',
          existingFullName: 'Jane Doe'
        };
        
        const result = getValidatedFormResult(fields);
        const emptyNameError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter the client name"
        );
        
        expect(emptyNameError).to.exist;
      });
    });

    describe('Email Address Validation', () => {
      it('should return no validation errors when email is valid and different from existing', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmail: 'jane@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const emailErrors = result.filter(rule => rule.isInvalid);
        
        expect(emailErrors).to.have.length(0);
      });

      it('should return unchanged email error when email matches existing (non-empty)', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmail: 'john@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const unchangedEmailError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text.includes("Enter the client email address, or select") &&
          rule.errorSummary.text.includes("Cancel")
        );
        
        expect(unchangedEmailError).to.exist;
        expect(unchangedEmailError?.inputError?.fieldName).to.equal('emailAddress');
      });

      it('should not return unchanged email error when email is empty (even if matches existing)', () => {
        const fields: ValidationFields = {
          emailAddress: '',
          existingEmail: ''
        };
        
        const result = getValidatedFormResult(fields);
        const unchangedEmailError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text.includes("Enter the client email address, or select") &&
          rule.errorSummary.text.includes("Cancel")
        );
        
        expect(unchangedEmailError).to.not.exist; // Should not have unchanged error for empty emails
      });

      it('should return format error for invalid email format', () => {
        const fields: ValidationFields = {
          emailAddress: 'invalid-email',
          existingEmail: 'valid@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const formatError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter an email address in the correct format, like name@example.com"
        );
        
        expect(formatError).to.exist;
        expect(formatError?.inputError?.fieldName).to.equal('emailAddress');
      });

      it('should validate various email formats correctly', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
          'user..name@domain.com' // consecutive dots are allowed by this simple regex
        ];

        const invalidEmails = [
          'invalid',
          '@domain.com',
          'user@',
          'user@.com',
          'user name@domain.com'   // spaces are invalid
        ];

        validEmails.forEach(email => {
          const fields: ValidationFields = {
            emailAddress: email,
            existingEmail: 'different@example.com'
          };
          
          const result = getValidatedFormResult(fields);
          const formatErrors = result.filter(rule => 
            rule.isInvalid && 
            rule.errorSummary.text === "Enter an email address in the correct format, like name@example.com"
          );
          
          expect(formatErrors, `Expected ${email} to be valid`).to.have.length(0);
        });

        invalidEmails.forEach(email => {
          const fields: ValidationFields = {
            emailAddress: email,
            existingEmail: 'different@example.com'
          };
          
          const result = getValidatedFormResult(fields);
          const formatErrors = result.filter(rule => 
            rule.isInvalid && 
            rule.errorSummary.text === "Enter an email address in the correct format, like name@example.com"
          );
          
          expect(formatErrors, `Expected ${email} to be invalid`).to.have.length(1);
        });
      });

      it('should handle empty email correctly (no format error for empty)', () => {
        const fields: ValidationFields = {
          emailAddress: '',
          existingEmail: 'existing@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const formatError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter an email address in the correct format, like name@example.com"
        );
        
        expect(formatError).to.not.exist; // Empty email should not trigger format error
      });

      it('should handle whitespace in email correctly', () => {
        const fields: ValidationFields = {
          emailAddress: '   ',
          existingEmail: 'existing@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const formatError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text === "Enter an email address in the correct format, like name@example.com"
        );
        
        expect(formatError).to.not.exist; // Whitespace-only email should not trigger format error
      });
    });

    describe('Combined Validation', () => {
      it('should validate both name and email fields together', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe',
          emailAddress: 'john@example.com',
          existingEmail: 'jane@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const errors = result.filter(rule => rule.isInvalid);
        
        expect(errors).to.have.length(0);
      });

      it('should return multiple errors when both fields are invalid', () => {
        const fields: ValidationFields = {
          fullName: '',
          existingFullName: 'Jane Doe',
          emailAddress: 'invalid-email',
          existingEmail: 'valid@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const errors = result.filter(rule => rule.isInvalid);
        
        expect(errors.length).to.be.greaterThan(1);
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing name fields gracefully', () => {
        const fields: ValidationFields = {
          emailAddress: 'test@example.com',
          existingEmail: 'different@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        
        expect(result).to.be.an('array');
        // Should only have email validations, no name validations
        const nameErrors = result.filter(rule => 
          rule.errorSummary.text.includes('client name')
        );
        expect(nameErrors).to.have.length(0);
      });

      it('should handle missing email fields gracefully', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe'
        };
        
        const result = getValidatedFormResult(fields);
        
        expect(result).to.be.an('array');
        // Should only have name validations, no email validations
        const emailErrors = result.filter(rule => 
          rule.errorSummary.text.includes('email')
        );
        expect(emailErrors).to.have.length(0);
      });

      it('should handle completely empty fields object', () => {
        const fields: ValidationFields = {};
        
        const result = getValidatedFormResult(fields);
        
        expect(result).to.be.an('array');
        expect(result).to.have.length(0);
      });
    });
  });
});
