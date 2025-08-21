/**
 * Form Validation Rules Tests
 * 
 * Tests the core validation logic for client details editing forms.
 * Validates business rules for name and email field validation including:
 * - Empty field detection
 * - Unchanged value detection  
 * - Email format validation
 * - Error message generation for GOV.UK design system compliance
 * 
 * Testing Level: Unit
 * Component: Business Logic Helpers
 * Dependencies: form-validation types
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { getValidatedFormResult } from '#src/scripts/helpers/formValidationRules.js';
import type { ValidationFields } from '#types/form-validation.js';

describe('Form Validation Rules', () => {
  describe('getValidatedFormResult', () => {
    describe('Full Name Validation', () => {
      it('should pass validation when client name is provided and differs from existing value', () => {
        const fields: ValidationFields = {
          fullName: 'John Doe',
          existingFullName: 'Jane Doe'
        };
        
        const result = getValidatedFormResult(fields);
        const fullNameErrors = result.filter(rule => rule.isInvalid);
        
        expect(fullNameErrors).to.have.length(0);
      });

      it('should require client name when field is empty', () => {
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

      it('should reject unchanged client name and suggest cancellation', () => {
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

      it('should trigger both empty and unchanged validation errors when name field is empty and matches existing empty value', () => {
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

      it('should treat whitespace-only names as empty and trigger validation error', () => {
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
      it('should pass validation when email address is valid and differs from existing value', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmailAddress: 'jane@example.com'
        };
        
        const result = getValidatedFormResult(fields);
        const emailErrors = result.filter(rule => rule.isInvalid);
        
        expect(emailErrors).to.have.length(0);
      });

      it('should reject unchanged email address and suggest cancellation when email matches existing value', () => {
        const fields: ValidationFields = {
          emailAddress: 'john@example.com',
          existingEmailAddress: 'john@example.com'
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

      it('should allow empty email addresses without triggering unchanged validation (optional field behavior)', () => {
        const fields: ValidationFields = {
          emailAddress: '',
          existingEmailAddress: ''
        };
        
        const result = getValidatedFormResult(fields);
        const unchangedEmailError = result.find(rule => 
          rule.isInvalid && 
          rule.errorSummary.text.includes("Enter the client email address, or select") &&
          rule.errorSummary.text.includes("Cancel")
        );
        
        expect(unchangedEmailError).to.not.exist; // Should not have unchanged error for empty emails
      });

      it('should reject invalid email format with GOV.UK standard error message', () => {
        const fields: ValidationFields = {
          emailAddress: 'invalid-email',
          existingEmailAddress: 'valid@example.com'
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
            existingEmailAddress: 'different@example.com'
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
            existingEmailAddress: 'different@example.com'
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
          existingEmailAddress: 'existing@example.com'
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
          existingEmailAddress: 'existing@example.com'
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
          existingEmailAddress: 'jane@example.com'
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
          existingEmailAddress: 'valid@example.com'
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
          existingEmailAddress: 'different@example.com'
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
