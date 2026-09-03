/**
 * Get Legal Help Form Schema Validation Tests
 *
 * Tests the express-validator schema for the get legal help form interstitial page.
 * All fields are optional; the evidence field just has a maximum length.
 *
 * Testing Level: Unit
 * Component: Validation Middleware
 * Dependencies: express-validator, ValidationErrorHelpers
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validateGetLegalHelpForm } from '#src/middlewares/getLegalHelpFormSchema.js';
import { validationResult } from 'express-validator';
import type { Request } from 'express';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH }: { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH: number } = config;

// Mock request object factory
function createMockRequest(body: any): Partial<Request> {
  return {
    body
  } as Partial<Request>;
}

describe('Get Legal Help Form Schema Validation', () => {
  before(() => {
    initializeI18nextSync();
  });

  describe('validateGetLegalHelpForm', () => {
    it('should pass validation when evidence is empty', async () => {
      const mockReq = createMockRequest({ evidence: '' });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should pass validation when evidence is missing entirely', async () => {
      const mockReq = createMockRequest({});

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should pass validation when evidence is within the max length', async () => {
      const mockReq = createMockRequest({ evidence: 'Some evidence requested from the client' });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should pass validation when evidence is exactly the max length', async () => {
      const mockReq = createMockRequest({ evidence: 'a'.repeat(MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH) });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should fail validation when evidence exceeds the max length', async () => {
      const mockReq = createMockRequest({ evidence: 'a'.repeat(MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH + 1) });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.false;

      const errorArray = errors.array();
      const evidenceError = errorArray.find((err: any) => err.path === 'evidence');
      expect(evidenceError).to.exist;
    });
  });

  describe('additionalCircumstances field', () => {
    it('should pass validation when no additional circumstances are selected', async () => {
      const mockReq = createMockRequest({ evidence: '' });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should pass validation when all selected values are recognised options', async () => {
      const mockReq = createMockRequest({ additionalCircumstances: ['ecf', 'legal-help-same-matter'] });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it('should fail validation when an unrecognised value is submitted', async () => {
      const mockReq = createMockRequest({ additionalCircumstances: ['not-a-real-option'] });

      const middleware = validateGetLegalHelpForm();
      await Promise.all(middleware.map(m => m(mockReq as Request, {} as any, () => { })));

      const errors = validationResult(mockReq as Request);
      expect(errors.isEmpty()).to.be.false;

      const errorArray = errors.array();
      const circumstancesError = errorArray.find((err: any) => err.path === 'additionalCircumstances');
      expect(circumstancesError).to.exist;
    });
  });
});
