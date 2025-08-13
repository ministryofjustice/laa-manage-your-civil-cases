/**
 * Client Date of Birth Schema Validation Tests
 * 
 * Tests the express-validator schema for client date of birth editing.
 * Validates the core change detection logic that ensures users must
 * make changes before submitting the form.
 * 
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { validateEditClientDateOfBirth } from '#src/middlewares/clientDateOfBirthSchema.js';
import { validationResult } from 'express-validator';
import type { Request } from 'express';

// Mock request object factory
function createMockRequest(body: any): Partial<Request> {
  return {
    body
  } as Partial<Request>;
}

describe('Client Date of Birth Schema Validation', () => {
  describe('validateEditClientDateOfBirth', () => {
    
    describe('Change Detection', () => {
      it('should pass validation when day changes', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '21',
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2022',
          originalDay: '20', // Different from input
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation when month changes', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '21',
          'dateOfBirth-month': '3', // Different from original
          'dateOfBirth-year': '2022',
          originalDay: '21',
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation when year changes', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '21',
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2023', // Different from original
          originalDay: '21',
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation when adding date to previously empty fields', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '21',
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2022',
          originalDay: '', // Empty original values
          originalMonth: '',
          originalYear: ''
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when no changes are made', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '21',
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2022',
          originalDay: '21', // Same as input
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;
        
        const errorArray = errors.array();
        expect(errorArray).to.have.length(1);
        // Check the actual structure - TypedValidationError has errorData property
        expect(errorArray[0].msg.errorData).to.be.an('object');
        expect(errorArray[0].msg.errorData.summaryMessage).to.equal('Update the client date of birth or select \'Cancel\'');
      });

      it('should fail validation when submitting empty form with empty originals', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': '',
          'dateOfBirth-month': '',
          'dateOfBirth-year': '',
          originalDay: '', // Same as input (both empty)
          originalMonth: '',
          originalYear: ''
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;
        
        const errorArray = errors.array();
        expect(errorArray).to.have.length(1);
        // Check the actual structure - TypedValidationError has errorData property
        expect(errorArray[0].msg.errorData).to.be.an('object');
        expect(errorArray[0].msg.errorData.summaryMessage).to.equal('Update the client date of birth or select \'Cancel\'');
      });
    });

    describe('Field Trimming', () => {
      it('should handle whitespace correctly in change detection', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': ' 21 ', // Has whitespace
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2022',
          originalDay: '21', // No whitespace
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        // Should pass because trimmed values are the same (no actual change)
        expect(errors.isEmpty()).to.be.false;
      });

      it('should detect real changes even with whitespace', async () => {
        const mockReq = createMockRequest({
          'dateOfBirth-day': ' 22 ', // Different value despite whitespace
          'dateOfBirth-month': '2',
          'dateOfBirth-year': '2022',
          originalDay: '21',
          originalMonth: '2',
          originalYear: '2022'
        });

        const middleware = validateEditClientDateOfBirth();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => {})));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });
    });
  });
});
