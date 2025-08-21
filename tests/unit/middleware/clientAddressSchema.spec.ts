/**
 * Client Address Schema Validation Tests
 * 
 * Tests the validation middleware for client address editing.
 * Validates that validation errors are thrown under the correct circumstances:
 * - Empty address/postcode handling (optional fields)
 * - Postcode uppercase conversion
 * - Change detection (AC5)
 * 
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { initializeI18nextSync, t } from '#src/scripts/helpers/index.js';

// Mock Express request object for testing
function createMockRequest(bodyData: Record<string, unknown>) {
  return {
    body: bodyData
  } as any;
}

describe('Client Address Schema Validation', () => {
  before(() => {
    // Initialize i18next for translations to work in tests
    initializeI18nextSync();
  });

  describe('validateEditClientAddress', () => {
    it('should create validation schema without throwing an error', () => {
      expect(() => validateEditClientAddress()).to.not.throw();
    });

    describe('address field validation', () => {
      it('should pass validation when address is empty (optional field)', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '', 
          postcode: '',
          existingAddress: 'Different St',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation when address contains only whitespace (optional field)', async () => {
        const testCases = ['   ', '\t\n ', '  \t  '];

        for (const testCase of testCases) {
          const schema = validateEditClientAddress();
          const req = createMockRequest({ 
            address: testCase,
            postcode: 'SW1A 1AA', // Make a change to avoid AC5 error
            existingAddress: 'Different St',
            existingPostcode: 'Different PC'
          });

          await Promise.all(schema.map(validation => validation.run(req)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for address: "${testCase}"`).to.be.true;
        }
      });

      it('should pass validation when address is valid', async () => {
        const validAddresses = [
          '123 Main Street',
          'Flat 2, Building Name, Street'
        ];

        for (const address of validAddresses) {
          const schema = validateEditClientAddress();
          const req = createMockRequest({ 
            address,
            postcode: 'SW1A 1AA',
            existingAddress: 'Different St',
            existingPostcode: 'Different PC'
          });

          await Promise.all(schema.map(validation => validation.run(req)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for: "${address}"`).to.be.true;
        }
      });

      it('should trim leading and trailing whitespace from address', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '  123 Main Street  ',
          postcode: 'SW1A 1AA',
          existingAddress: 'Different St',
          existingPostcode: 'Different PC'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        
        // Check that address was trimmed
        expect(req.body.address).to.equal('123 Main Street');
      });
    });

    describe('postcode field validation', () => {
      it('should pass validation when postcode is empty (optional field)', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street', 
          postcode: '',
          existingAddress: 'Different St',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should convert postcode to uppercase', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street',
          postcode: 'sw1a 1aa',
          existingAddress: 'Different St',
          existingPostcode: 'Different PC'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        
        // Check that postcode was converted to uppercase
        expect(req.body.postcode).to.equal('SW1A 1AA');
      });

      it('should pass validation when postcode contains only whitespace (optional field)', async () => {
        const testCases = ['   ', '\t\n ', '  \t  '];

        for (const testCase of testCases) {
          const schema = validateEditClientAddress();
          const req = createMockRequest({ 
            address: '123 Main Street', // Make a change to avoid AC5 error
            postcode: testCase,
            existingAddress: 'Different St',
            existingPostcode: 'Different PC'
          });

          await Promise.all(schema.map(validation => validation.run(req)));
          const errors = validationResult(req);

          expect(errors.isEmpty(), `Expected validation to pass for postcode: "${testCase}"`).to.be.true;
        }
      });

      it('should trim leading and trailing whitespace from postcode', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street',
          postcode: '  SW1A 1AA  ',
          existingAddress: 'Different St',
          existingPostcode: 'Different PC'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        
        // Check that postcode was trimmed and converted to uppercase
        expect(req.body.postcode).to.equal('SW1A 1AA');
      });
    });

    describe('change detection (AC5)', () => {
      it('should have validation errors when no changes are made', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street',
          postcode: 'SW1A 1AA',
          existingAddress: '123 Main Street',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        
        const changeError = errors.array().find(error => error.summaryMessage.includes('Update the client address'));
        expect(changeError).to.exist;
        expect(changeError?.summaryMessage).to.equal(t('forms.clientDetails.address.validationError.notChanged'));
      });

      it('should pass validation when address changes', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '456 New Street',
          postcode: 'SW1A 1AA',
          existingAddress: '123 Main Street',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation when postcode changes', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street',
          postcode: 'W1A 0AX',
          existingAddress: '123 Main Street',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req);

        expect(errors.isEmpty()).to.be.true;
      });

      it('should handle whitespace differences in change detection', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: ' 123 Main Street ',
          postcode: ' SW1A 1AA ',
          existingAddress: '123 Main Street',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req).formatWith(formatValidationError);

        // Should detect as unchanged after trimming
        expect(errors.isEmpty()).to.be.false;
        
        const changeError = errors.array().find(error => error.summaryMessage.includes(t('forms.clientDetails.address.validationError.notChanged')));
        expect(changeError).to.exist;
      });
    });

    describe('error structure validation', () => {
      it('should produce correctly formatted errors when used with formatValidationError', async () => {
        const schema = validateEditClientAddress();
        const req = createMockRequest({ 
          address: '123 Main Street',  // No change to trigger AC5 error
          postcode: 'SW1A 1AA',
          existingAddress: '123 Main Street',
          existingPostcode: 'SW1A 1AA'
        });

        await Promise.all(schema.map(validation => validation.run(req)));
        const errors = validationResult(req).formatWith(formatValidationError);

        expect(errors.isEmpty()).to.be.false;
        
        const errorData = errors.array()[0];
        expect(errorData).to.have.property('summaryMessage');
        expect(errorData).to.have.property('inlineMessage');
        expect(errorData.summaryMessage).to.be.a('string');
        expect(errorData.inlineMessage).to.be.a('string');
      });
    });
  });
});
