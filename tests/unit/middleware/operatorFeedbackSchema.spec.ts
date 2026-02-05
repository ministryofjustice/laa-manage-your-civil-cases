/**
 * Operator Feedback Schema Validation Tests
 * 
 * Tests the express-validator schema for operator feedback form.
 * Validates the category selection and comment field requirements
 * including length constraints and required field validation.
 * 
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validateOperatorFeedback } from '#src/middlewares/operatorFeedbackSchema.js';
import { validationResult } from 'express-validator';
import type { Request } from 'express';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';

// Mock request object factory
function createMockRequest(body: any): Partial<Request> {
  return {
    body
  } as Partial<Request>;
}

describe('Operator Feedback Schema Validation', () => {
  before(() => {
    // Initialize i18next for translations to work in tests
    initializeI18nextSync();
  });

  describe('validateOperatorFeedback', () => {

    describe('Category Field', () => {
      it('should pass validation when category is provided', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'Test feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when category is empty', async () => {
        const mockReq = createMockRequest({
          category: '',
          comment: 'Test feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const categoryError = errorArray.find((err: any) => err.path === 'category');
        expect(categoryError).to.exist;
      });

      it('should fail validation when category is missing', async () => {
        const mockReq = createMockRequest({
          comment: 'Test feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const categoryError = errorArray.find((err: any) => err.path === 'category');
        expect(categoryError).to.exist;
      });

      it('should trim whitespace from category', async () => {
        const mockReq = createMockRequest({
          category: '  ADCO  ',
          comment: 'Test feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        expect(mockReq.body?.category).to.equal('ADCO');
      });

      it('should fail validation when category is only whitespace', async () => {
        const mockReq = createMockRequest({
          category: '   ',
          comment: 'Test feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const categoryError = errorArray.find((err: any) => err.path === 'category');
        expect(categoryError).to.exist;
      });
    });

    describe('Comment Field', () => {
      it('should pass validation when comment is provided', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'This is a valid feedback comment'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when comment is empty', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: ''
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const commentError = errorArray.find((err: any) => err.path === 'comment');
        expect(commentError).to.exist;
      });

      it('should fail validation when comment is missing', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const commentError = errorArray.find((err: any) => err.path === 'comment');
        expect(commentError).to.exist;
      });

      it('should trim whitespace from comment', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: '  This is feedback  '
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        expect(mockReq.body?.comment).to.equal('This is feedback');
      });

      it('should fail validation when comment is only whitespace', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: '     '
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const commentError = errorArray.find((err: any) => err.path === 'comment');
        expect(commentError).to.exist;
      });

      it('should pass validation with maximum allowed comment length (2500 characters)', async () => {
        const maxLengthComment = 'a'.repeat(2500);
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: maxLengthComment
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when comment exceeds maximum length (2500 characters)', async () => {
        const tooLongComment = 'a'.repeat(2501);
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: tooLongComment
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        const commentError = errorArray.find((err: any) => err.path === 'comment');
        expect(commentError).to.exist;
      });

      it('should pass validation with a single character comment', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'a'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation with comment containing special characters', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'Feedback with special chars: @#$%^&*() "quotes" and \'apostrophes\''
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation with comment containing newlines', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'Line 1\nLine 2\nLine 3'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should pass validation with comment containing unicode characters', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: 'Feedback with émojis 😊 and spëcial çharacters'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });
    });

    describe('Combined Validation', () => {
      it('should pass validation with valid category and comment', async () => {
        const mockReq = createMockRequest({
          category: 'ACPR',
          comment: 'The advisor provided excellent assistance and resolved my issue quickly.'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });

      it('should fail validation when both category and comment are empty', async () => {
        const mockReq = createMockRequest({
          category: '',
          comment: ''
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        expect(errorArray).to.have.length.at.least(2);

        const categoryError = errorArray.find((err: any) => err.path === 'category');
        const commentError = errorArray.find((err: any) => err.path === 'comment');

        expect(categoryError).to.exist;
        expect(commentError).to.exist;
      });

      it('should fail validation when both category and comment are missing', async () => {
        const mockReq = createMockRequest({});

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;

        const errorArray = errors.array();
        expect(errorArray).to.have.length.at.least(2);
      });

      it('should trim whitespace from both category and comment', async () => {
        const mockReq = createMockRequest({
          category: '  OTHR  ',
          comment: '  Valid feedback text  '
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        expect(mockReq.body?.category).to.equal('OTHR');
        expect(mockReq.body?.comment).to.equal('Valid feedback text');

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.true;
      });
    });

    describe('Edge Cases', () => {
      it('should handle null values gracefully', async () => {
        const mockReq = createMockRequest({
          category: null,
          comment: null
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;
      });

      it('should handle undefined values gracefully', async () => {
        const mockReq = createMockRequest({
          category: undefined,
          comment: undefined
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;
      });

      it('should handle comment with only line breaks', async () => {
        const mockReq = createMockRequest({
          category: 'ADCO',
          comment: '\n\n\n'
        });

        const middleware = validateOperatorFeedback();
        await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

        const errors = validationResult(mockReq as Request);
        expect(errors.isEmpty()).to.be.false;
      });
    });
  });
});
