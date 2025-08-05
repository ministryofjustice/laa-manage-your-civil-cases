/**
 * Tests for GOV.UK error types and type guards.
 */

import { expect } from 'chai';
import {
  ERROR_PRIORITIES,
  ERROR_CODES,
  isGovUkValidationError,
  isGovUkComplexValidationError,
  type GovUkValidationError,
  type GovUkComplexValidationError,
  type ErrorPriority,
  type ErrorCode
} from '#src/validation/types/govUkErrorTypes.js';

describe('GOV.UK Error Types', () => {
  describe('ERROR_PRIORITIES', () => {
    it('should define all required priority levels', () => {
      expect(ERROR_PRIORITIES.MISSING_ALL).to.equal(5);
      expect(ERROR_PRIORITIES.MISSING_FIELD).to.equal(10);
      expect(ERROR_PRIORITIES.FORMAT_ERROR).to.equal(15);
      expect(ERROR_PRIORITIES.BUSINESS_RULE).to.equal(20);
      expect(ERROR_PRIORITIES.FUTURE_DATE).to.equal(25);
      expect(ERROR_PRIORITIES.PAST_DATE).to.equal(30);
    });

    it('should maintain priority ordering (lower number = higher priority)', () => {
      expect(ERROR_PRIORITIES.MISSING_ALL).to.be.lessThan(ERROR_PRIORITIES.MISSING_FIELD);
      expect(ERROR_PRIORITIES.MISSING_FIELD).to.be.lessThan(ERROR_PRIORITIES.FORMAT_ERROR);
      expect(ERROR_PRIORITIES.FORMAT_ERROR).to.be.lessThan(ERROR_PRIORITIES.BUSINESS_RULE);
      expect(ERROR_PRIORITIES.BUSINESS_RULE).to.be.lessThan(ERROR_PRIORITIES.FUTURE_DATE);
      expect(ERROR_PRIORITIES.FUTURE_DATE).to.be.lessThan(ERROR_PRIORITIES.PAST_DATE);
    });
  });

  describe('ERROR_CODES', () => {
    it('should define all required error codes', () => {
      expect(ERROR_CODES.MISSING_REQUIRED).to.equal('MISSING_REQUIRED');
      expect(ERROR_CODES.INVALID_DATE).to.equal('INVALID_DATE');
      expect(ERROR_CODES.FUTURE_DATE).to.equal('FUTURE_DATE');
      expect(ERROR_CODES.PAST_DATE).to.equal('PAST_DATE');
      expect(ERROR_CODES.FORMAT_ERROR).to.equal('FORMAT_ERROR');
      expect(ERROR_CODES.BUSINESS_RULE).to.equal('BUSINESS_RULE');
    });

    it('should use consistent naming convention', () => {
      const codes = Object.values(ERROR_CODES);
      codes.forEach(code => {
        expect(code).to.match(/^[A-Z_]+$/);
      });
    });
  });

  describe('Type Guards', () => {
    describe('isGovUkValidationError', () => {
      it('should correctly identify GOV.UK validation errors', () => {
        const govukError = new Error('Test message') as GovUkValidationError;
        Object.defineProperty(govukError, 'msg', { value: 'Test message', enumerable: true });
        Object.defineProperty(govukError, 'param', { value: 'testField', enumerable: true });
        Object.defineProperty(govukError, 'href', { value: '#testField', enumerable: true });
        Object.defineProperty(govukError, 'type', { value: 'validation_error', enumerable: true });
        Object.defineProperty(govukError, 'fieldName', { value: 'testField', enumerable: true });
        Object.defineProperty(govukError, 'priority', { value: ERROR_PRIORITIES.FORMAT_ERROR, enumerable: true });
        Object.defineProperty(govukError, 'timestamp', { value: new Date().toISOString(), enumerable: true });

        expect(isGovUkValidationError(govukError)).to.be.true;
      });

      it('should reject generic Error objects', () => {
        const genericError = new Error('Generic error');
        expect(isGovUkValidationError(genericError)).to.be.false;
      });

      it('should reject objects missing required properties', () => {
        const incompleteError = {
          message: 'Test message',
          msg: 'Test message',
          param: 'testField'
          // Missing href, type, priority
        };

        expect(isGovUkValidationError(incompleteError)).to.be.false;
      });

      it('should reject objects with wrong type discriminator', () => {
        const wrongType = {
          name: 'Error',
          message: 'Test message',
          msg: 'Test message',
          param: 'testField',
          href: '#testField',
          type: 'other_error', // Wrong type
          fieldName: 'testField',
          priority: ERROR_PRIORITIES.FORMAT_ERROR,
          timestamp: new Date().toISOString()
        };

        expect(isGovUkValidationError(wrongType)).to.be.false;
      });
    });

    describe('isGovUkComplexValidationError', () => {
      it('should correctly identify complex validation errors', () => {
        const complexError = new Error('Test message') as GovUkComplexValidationError;
        Object.defineProperty(complexError, 'msg', { value: 'Test message', enumerable: true });
        Object.defineProperty(complexError, 'param', { value: 'testField', enumerable: true });
        Object.defineProperty(complexError, 'href', { value: '#testField', enumerable: true });
        Object.defineProperty(complexError, 'type', { value: 'validation_error', enumerable: true });
        Object.defineProperty(complexError, 'fieldName', { value: 'testField', enumerable: true });
        Object.defineProperty(complexError, 'priority', { value: ERROR_PRIORITIES.FORMAT_ERROR, enumerable: true });
        Object.defineProperty(complexError, 'timestamp', { value: new Date().toISOString(), enumerable: true });
        Object.defineProperty(complexError, 'relatedFields', { value: ['field1', 'field2'], enumerable: true });
        Object.defineProperty(complexError, 'rule', { value: 'custom-rule', enumerable: true });

        expect(isGovUkComplexValidationError(complexError)).to.be.true;
      });

      it('should accept errors with only relatedFields', () => {
        const errorWithRelated = new Error('Test message') as GovUkComplexValidationError;
        Object.defineProperty(errorWithRelated, 'msg', { value: 'Test message', enumerable: true });
        Object.defineProperty(errorWithRelated, 'param', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithRelated, 'href', { value: '#testField', enumerable: true });
        Object.defineProperty(errorWithRelated, 'type', { value: 'validation_error', enumerable: true });
        Object.defineProperty(errorWithRelated, 'fieldName', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithRelated, 'priority', { value: ERROR_PRIORITIES.FORMAT_ERROR, enumerable: true });
        Object.defineProperty(errorWithRelated, 'timestamp', { value: new Date().toISOString(), enumerable: true });
        Object.defineProperty(errorWithRelated, 'relatedFields', { value: ['field1'], enumerable: true });

        expect(isGovUkComplexValidationError(errorWithRelated)).to.be.true;
      });

      it('should accept errors with only rule', () => {
        const errorWithRule = new Error('Test message') as GovUkComplexValidationError;
        Object.defineProperty(errorWithRule, 'msg', { value: 'Test message', enumerable: true });
        Object.defineProperty(errorWithRule, 'param', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithRule, 'href', { value: '#testField', enumerable: true });
        Object.defineProperty(errorWithRule, 'type', { value: 'validation_error', enumerable: true });
        Object.defineProperty(errorWithRule, 'fieldName', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithRule, 'priority', { value: ERROR_PRIORITIES.FORMAT_ERROR, enumerable: true });
        Object.defineProperty(errorWithRule, 'timestamp', { value: new Date().toISOString(), enumerable: true });
        Object.defineProperty(errorWithRule, 'rule', { value: 'custom-rule', enumerable: true });

        expect(isGovUkComplexValidationError(errorWithRule)).to.be.true;
      });

      it('should accept errors with only context', () => {
        const errorWithContext = new Error('Test message') as GovUkComplexValidationError;
        Object.defineProperty(errorWithContext, 'msg', { value: 'Test message', enumerable: true });
        Object.defineProperty(errorWithContext, 'param', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithContext, 'href', { value: '#testField', enumerable: true });
        Object.defineProperty(errorWithContext, 'type', { value: 'validation_error', enumerable: true });
        Object.defineProperty(errorWithContext, 'fieldName', { value: 'testField', enumerable: true });
        Object.defineProperty(errorWithContext, 'priority', { value: ERROR_PRIORITIES.FORMAT_ERROR, enumerable: true });
        Object.defineProperty(errorWithContext, 'timestamp', { value: new Date().toISOString(), enumerable: true });
        Object.defineProperty(errorWithContext, 'context', { value: { additionalInfo: 'test' }, enumerable: true });

        expect(isGovUkComplexValidationError(errorWithContext)).to.be.true;
      });

      it('should reject basic GOV.UK validation errors', () => {
        const basicError = {
          name: 'Error',
          message: 'Test message',
          msg: 'Test message',
          param: 'testField',
          href: '#testField',
          type: 'validation_error',
          fieldName: 'testField',
          priority: ERROR_PRIORITIES.FORMAT_ERROR,
          timestamp: new Date().toISOString()
          // No complex properties
        } as GovUkValidationError;

        expect(isGovUkComplexValidationError(basicError)).to.be.false;
      });
    });
  });

  describe('Type Aliases', () => {
    it('should properly type ErrorPriority', () => {
      const priority: ErrorPriority = ERROR_PRIORITIES.FORMAT_ERROR;
      expect(typeof priority).to.equal('number');
    });

    it('should properly type ErrorCode', () => {
      const code: ErrorCode = ERROR_CODES.INVALID_DATE;
      expect(typeof code).to.equal('string');
    });
  });
});
