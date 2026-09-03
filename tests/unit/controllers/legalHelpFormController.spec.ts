/**
 * Legal Help Form Controller Tests
 *
 * Tests the Express.js controllers for the "get legal help form" interstitial page and
 * the (placeholder) legal help form page.
 * Covers HTTP request/response handling for:
 * - GET route handler for the interstitial form display
 * - POST route handler for the interstitial form submission (session storage, not persisted to the API)
 * - GET route handler for the legal help form, populated from the session
 *
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Controllers
 * Dependencies: apiService, form validation integration
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import {
  getLegalHelpFormInterstitial,
  submitLegalHelpFormInterstitial,
  getLegalHelpForm
} from '#src/scripts/controllers/legalHelpFormController.js';
import { apiService } from '#src/services/apiService.js';
import '#utils/server/axiosSetup.js';
import { validateGetLegalHelpForm } from '#src/middlewares/getLegalHelpFormSchema.js';
import { ValidationChain } from 'express-validator';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
  clientData?: any;
}

// Run an express-validator schema against a fake request
const runSchema = async (req: any, schema: ValidationChain[] | ValidationChain): Promise<void> => {
  const chains = Array.isArray(schema) ? schema : [schema];
  for (const chain of chains) {
    await chain.run(req);
  }
};

describe('Legal Help Form Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let getClientDetailsStub: sinon.SinonStub;

  before(() => {
    initializeI18nextSync();
  });

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      session: {} as any,
      axiosMiddleware: {} as any,
      csrfToken: () => 'test-csrf-token',
      clientData: {
        fullName: 'John Doe',
        caseReference: 'TEST123'
      }
    } as Partial<RequestWithMiddleware>;

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });

    res = {
      render: renderStub,
      redirect: redirectStub,
      status: statusStub
    };

    next = sinon.stub();

    getClientDetailsStub = sinon.stub(apiService, 'getClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getLegalHelpFormInterstitial', () => {
    it('should render the interstitial form with an empty starting state and CSRF protection', () => {
      getLegalHelpFormInterstitial(req as Request, res as Response, next as NextFunction);

      expect(renderStub.calledWith('case_details/legal-help-form-interstitial.njk')).to.be.true;

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.caseReference).to.equal('TEST123');
      expect(renderArgs.client).to.deep.equal(req.clientData);
      expect(renderArgs.currentEvidence).to.equal('');
      expect(renderArgs.currentAdditionalCircumstances).to.deep.equal([]);
      expect(renderArgs.circumstanceItems).to.be.an('array').with.lengthOf(3);
      expect(renderArgs.csrfToken).to.equal('test-csrf-token');
    });

    it('should render an error page when the case reference is invalid', () => {
      req.params = { caseReference: '' };

      getLegalHelpFormInterstitial(req as Request, res as Response, next as NextFunction);

      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
    });

    it('should delegate render exceptions to Express error handling middleware', () => {
      renderStub.throws(new Error('Render error'));

      getLegalHelpFormInterstitial(req as Request, res as Response, next as NextFunction);

      expect(next.calledOnce).to.be.true;
    });
  });

  describe('submitLegalHelpFormInterstitial', () => {
    it('should store the answers in session (not via the API) and redirect to the legal help form', async () => {
      req.body = {
        evidence: 'Bank statements for the last 3 months',
        additionalCircumstances: ['ecf', 'legal-help-same-matter']
      };

      await runSchema(req as any, validateGetLegalHelpForm());

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect(getClientDetailsStub.called).to.be.false;
      expect((req.session as any).legalHelpFormAnswers).to.deep.equal({
        caseReference: 'TEST123',
        evidence: 'Bank statements for the last 3 months',
        additionalCircumstances: ['ecf', 'legal-help-same-matter']
      });
      expect(redirectStub.calledWith('/cases/TEST123/legal-help-form')).to.be.true;
    });

    it('should store empty answers when all fields are left blank, since all fields are optional', async () => {
      req.body = { evidence: '', additionalCircumstances: [] };

      await runSchema(req as any, validateGetLegalHelpForm());

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect((req.session as any).legalHelpFormAnswers).to.deep.equal({
        caseReference: 'TEST123',
        evidence: '',
        additionalCircumstances: []
      });
      expect(redirectStub.calledWith('/cases/TEST123/legal-help-form')).to.be.true;
    });

    it('should re-render the form with validation errors when evidence exceeds the max length', async () => {
      req.body = { evidence: 'a'.repeat(5001) };

      getClientDetailsStub.resolves({
        status: 'success',
        data: { fullName: 'John Doe', caseReference: 'TEST123' }
      });

      await runSchema(req as any, validateGetLegalHelpForm());

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('case_details/legal-help-form-interstitial.njk')).to.be.true;
      expect(redirectStub.called).to.be.false;

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error.inputErrors.evidence).to.be.a('string').and.not.empty;
      expect((req.session as any).legalHelpFormAnswers).to.be.undefined;
    });

    it('should re-render the form with validation errors when an unrecognised additionalCircumstances value is submitted', async () => {
      req.body = { additionalCircumstances: ['not-a-real-option'] };

      getClientDetailsStub.resolves({
        status: 'success',
        data: { fullName: 'John Doe', caseReference: 'TEST123' }
      });

      await runSchema(req as any, validateGetLegalHelpForm());

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect(statusStub.calledWith(400)).to.be.true;
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error.inputErrors.additionalCircumstances).to.be.a('string').and.not.empty;
      expect((req.session as any).legalHelpFormAnswers).to.be.undefined;
    });

    it('should render a not found error page when the client details refetch fails on a validation error', async () => {
      req.body = { evidence: 'a'.repeat(5001) };

      getClientDetailsStub.resolves({
        status: 'error',
        data: null,
        message: 'Case not found'
      });

      await runSchema(req as any, validateGetLegalHelpForm());

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect(statusStub.calledWith(404)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.error).to.equal('Case not found');
    });

    it('should render an error page when the case reference is invalid', async () => {
      req.params = { caseReference: '' };
      req.body = { evidence: 'Some evidence' };

      await submitLegalHelpFormInterstitial(req as RequestWithMiddleware, res as Response, next);

      expect(getClientDetailsStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
    });
  });

  describe('getLegalHelpForm', () => {
    it('should render the legal help form populated from the session', () => {
      req.session = {
        legalHelpFormAnswers: {
          caseReference: 'TEST123',
          evidence: 'Bank statements',
          additionalCircumstances: ['ecf']
        }
      } as any;

      getLegalHelpForm(req as Request, res as Response, next as NextFunction);

      expect(renderStub.calledWith('case_details/legal-help-form.njk')).to.be.true;

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.evidence).to.equal('Bank statements');
      expect(renderArgs.additionalCircumstances).to.deep.equal([
        'This is an application for Exceptional Case Funding (ECF)'
      ]);
    });

    it('should render with empty defaults when nothing was stored in session', () => {
      getLegalHelpForm(req as Request, res as Response, next as NextFunction);

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.evidence).to.equal('');
      expect(renderArgs.additionalCircumstances).to.deep.equal([]);
    });

    it('should ignore session answers left over from a different case', () => {
      req.session = {
        legalHelpFormAnswers: {
          caseReference: 'OTHER-CASE',
          evidence: 'Evidence for a different case',
          additionalCircumstances: ['ecf']
        }
      } as any;

      getLegalHelpForm(req as Request, res as Response, next as NextFunction);

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.evidence).to.equal('');
      expect(renderArgs.additionalCircumstances).to.deep.equal([]);
    });

    it('should render an error page when the case reference is invalid', () => {
      req.params = { caseReference: '' };

      getLegalHelpForm(req as Request, res as Response, next as NextFunction);

      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
    });

    it('should delegate render exceptions to Express error handling middleware', () => {
      renderStub.throws(new Error('Render error'));

      getLegalHelpForm(req as Request, res as Response, next as NextFunction);

      expect(next.calledOnce).to.be.true;
    });
  });
});
