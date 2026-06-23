/**
 * Change Category Of Law Controller Tests
 *
 * Tests the Express.js controllers for changing case category functionality.
 * Covers HTTP request/response handling for category change forms including:
 * - GET route handlers for form display
 * - POST route handlers for form submission
 * - API integration and error handling
 * - Form validation handling
 * - Rendering and redirect behaviour
 *
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Controllers
 * Dependencies: apiService, validation helpers
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';

import {
  getChangeCategoryOfLaw,
  submitChangeCategoryOfLawForm
} from '#src/scripts/controllers/editCategoryOfLawController.js';
import { apiService } from '#src/services/apiService.js';
import { ValidationChain } from 'express-validator';
import { validateChangeCategoryOfLaw } from '#src/middlewares/changeCategoryOfLawSchema.js';

// Import axios middleware types
import '#utils/server/axiosSetup.js';

interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
  clientData?: {
    providerId: string;
    category?: string;
    outcome_code?: string;
  };
}

describe('Change Category Of Law Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let apiChangeCategoryStub: sinon.SinonStub;
  let apiProviderChoicesStub: sinon.SinonStub;

  const runSchema = async (
    req: any,
    schema: ValidationChain[] | ValidationChain
  ): Promise<void> => {
    const chains = Array.isArray(schema) ? schema : [schema];
    for (const chain of chains) {
      await chain.run(req);
    }
  };

  beforeEach(() => {

    req = {
      params: { caseReference: 'TEST123' }, 
      body: { category: 'DEBT', notes: 'test' },
      clientData: {
        providerId: '123',
        category: 'housing',
        outcome_code: 'SPOP'
      },
      axiosMiddleware: {},
      csrfToken: () => 'token'
    };

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });

    res = {
      render: renderStub,
      redirect: redirectStub,
      status: statusStub
    };

    next = sinon.stub();

    // Stub API
    apiProviderChoicesStub = sinon.stub(apiService, 'getProviderChoices');
    apiChangeCategoryStub = sinon.stub(apiService, 'changeCaseCategory');
  });

  afterEach(() => {
    sinon.restore();
  });

  // GET CONTROLLER TESTS

  describe('getChangeCategoryOfLaw', () => {

    it('should render change category page successfully', async () => {
      apiProviderChoicesStub.resolves({
        status: 'success',
        data: {
          law_category: [
            {
              code: "housing",
              name: "Housing, eviction and homelessness"
            },
            {
              code: "debt",
              name: "Debt, money problems and bankruptcy",
            }
          ]
        }
      });

      await getChangeCategoryOfLaw(req as RequestWithMiddleware, res as Response, next);

      expect(renderStub.calledOnce).to.be.true;
      expect(renderStub.firstCall.args[0]).to.equal('case_details/change-category-of-law.njk');
    });

    it('should filter out current category from options', async () => {
      apiProviderChoicesStub.resolves({
        status: 'success',
        data: {
          law_category: [
            {
              code: "housing",
              name: "Housing, eviction and homelessness"
            },
            {
              code: "debt",
              name: "Debt, money problems and bankruptcy",
            }
          ]
        }
      });

      await getChangeCategoryOfLaw(req as RequestWithMiddleware, res as Response, next);

      const renderData = renderStub.firstCall.args[1];
      const items = renderData.categoryItems;

      expect(items.some((i: any) => i.value === 'Housing, eviction and homelessness')).to.be.false;
    });

    it('should call next on API error', async () => {
      apiProviderChoicesStub.rejects(new Error('API failure'));

      await getChangeCategoryOfLaw(req as RequestWithMiddleware, res as Response, next);

      expect(next.calledOnce).to.be.true;
    });
  });

  // POST CONTROLLER TESTS
  
  describe('submitChangeCategoryOfLawForm', () => {

    it('should redirect on successful category change', async () => {
      req.body = {
        category: 'DEBT',
        notes: 'Changing category'
      };

      apiChangeCategoryStub.resolves({
        status: 'success'
      });

      await runSchema(req, validateChangeCategoryOfLaw());
      await submitChangeCategoryOfLawForm(req as RequestWithMiddleware, res as Response, next);

      expect(apiChangeCategoryStub.calledOnce).to.be.true;

      expect(apiChangeCategoryStub.calledWith(
        req.axiosMiddleware,
        'TEST123',
        'DEBT',
        'Changing category'
      )).to.be.true;

      expect(redirectStub.calledWith('/cases/TEST123/case-details')).to.be.true;
      expect(req.clientData?.outcome_code).to.equal('SPOP');
    });

    it('should render form with errors when validation fails', async () => {
      req.body = {
        category: '',
        notes: ''
      };

      apiProviderChoicesStub.resolves({
        status: 'success',
        data: {
          law_category: [
            {
              code: "housing",
              name: "Housing, eviction and homelessness"
            },
            {
              code: "debt",
              name: "Debt, money problems and bankruptcy",
            }
          ]
        }
      });

      await runSchema(req, validateChangeCategoryOfLaw());
      await submitChangeCategoryOfLawForm(req as RequestWithMiddleware, res as Response, next);

      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.called).to.be.true;
      expect(redirectStub.called).to.be.false;
    });

    it('should call next when API returns error status', async () => {
      req.body = {
        category: 'DEBT',
        notes: 'test'
      };

      apiChangeCategoryStub.resolves({
        status: 'error',
        message: 'API failed'
      });

      await runSchema(req, validateChangeCategoryOfLaw());
      await submitChangeCategoryOfLawForm(req as RequestWithMiddleware, res as Response, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should call next when API throws error', async () => {
      req.body = {
        category: 'DEBT',
        notes: 'test'
      };

      apiChangeCategoryStub.rejects(new Error('Network error'));

      await submitChangeCategoryOfLawForm(req as RequestWithMiddleware, res as Response, next);

      expect(next.calledOnce).to.be.true;
    });
  });
});