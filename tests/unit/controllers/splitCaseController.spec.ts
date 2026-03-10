/**
 * Split Case Controller Tests
 * 
 * Tests the Express.js controller factory for case listing functionality.
 * Covers HTTP request/response handling for form including:
 * - GET route handler for form display with dynamic choices
 * - POST route handler for form submission  
 * - CSRF token management
 * - Form data processing and validation integration
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Dynamic Route Handlers
 * Dependencies: apiService, case listing templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import { getSplitThisCaseForm, getAboutNewCaseForm, submitAboutNewCaseForm } from '#src/scripts/controllers/splitCaseController.js';
import { apiService } from '#src/services/apiService.js';
import { validateAboutNewCase } from '#src/middlewares/aboutNewCaseSchema.js';
import type { ValidationChain } from 'express-validator';

// helper: run validator middleware

async function runMiddleware(
  middlewares: ValidationChain[],
  req: Request
): Promise<void> {
  for (const mw of middlewares) {
    await mw.run(req);
  }
}

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
  clientData?: any;
}

describe('Split Case Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: Partial<Response>;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let getProviderChoicesStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      session: {} as any,
      axiosMiddleware: {} as any,
      csrfToken: () => 'test-csrf-token'
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

    getProviderChoicesStub = sinon.stub(apiService, 'getProviderChoices');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleSplitCase', () => {
    it('should render "split this case" page with correct template', async () => {
      // Arrange
      const mockClientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01',
        providerId: '12'
      };
      req.clientData = mockClientData;

      getProviderChoicesStub
        .withArgs(req.axiosMiddleware, '12')
        .resolves({
          status: 'success',
          data: { id: '12', name: 'General Provider' }
        });

      // Act
      await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.called).to.be.true;
      expect(
        renderStub.calledWith(
          'case_details/split-this-case.njk',
          sinon.match({
            caseReference: 'TEST123',
            client: mockClientData,
            provider: sinon.match({ id: '12' }),
            errorState: sinon.match({ hasErrors: false }),
            csrfToken: 'test-csrf-token'
          })
        )
      ).to.be.true;

      expect(next.called).to.be.false;
    });

    // Arrange
    it('should call next with error when providerId is missing', async () => {
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01',
        providerId: ''  // No providerId on purpose
      };

      // Act
      await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.called).to.be.false;
      expect(next.calledOnce).to.be.true; // Should delegate to error handler
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(Error);
    });

    // Arrange
    it('should call next with error when provider choices API fails', async () => {
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01',
        providerId: '99'
      };

      // Simulate API error response (either status: 'error' OR data: null)
      getProviderChoicesStub
        .withArgs(req.axiosMiddleware, '99')
        .resolves({ status: 'error', data: null });

      // Act
      await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.called).to.be.false;
      expect(next.calledOnce).to.be.true; // Should delegate to error handler
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(Error);
    });
  });

  describe('getAboutNewCaseForm', () => {
    let req: any;
    let res: any;
    let next: sinon.SinonStub;

    let getAllCategoriesStub: sinon.SinonStub;

    beforeEach(() => {
      req = {
        params: { caseReference: 'TEST123' },
        axiosMiddleware: {},
        session: {},
        csrfToken: () => 'test-token',
        clientData: {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          providerId: '20'
        }
      };

      res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      next = sinon.stub();

      getAllCategoriesStub = sinon.stub(apiService, 'getAllCategories');
    });

    afterEach(() => sinon.restore());

    // INTERNAL === FALSE (operator handling)

    it('should fetch all categories when internal=false and render list', async () => {
      req.session.splitCaseCache = { internal: 'false' };

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing', description: '' }
          ]
        }
      });

      const mockCategories = [
        {
          code: "housing",
          name: "Housing, eviction and homelessness",
          description: "",
          ecf_available: true,
          mandatory: false
        },
        {
          code: "debt",
          name: "Debt, money problems and bankruptcy",
          description: "",
          ecf_available: true,
          mandatory: true
        },
         {
          code: "none",
          name: "None of the above",
          description: "",
          ecf_available: false,
          mandatory: false
        }
      ];

      getAllCategoriesStub.resolves({
        status: 'success',
        data: mockCategories
      });

      await getAboutNewCaseForm(req, res, next);

      expect(res.render.calledOnce).to.be.true;
      const [, renderData] = res.render.firstCall.args;

      // Expect the placeholder exists
      const placeholder = renderData.categoryItems.find((i: any) => i.value === '');
      expect(placeholder).to.exist;
      expect(placeholder.text).to.be.a('string').and.not.empty;
      expect(placeholder.selected).to.equal(true);

      // Expect housing category
      const housing = renderData.categoryItems.find((i: any) => i.value === 'housing');
      expect(housing).to.exist;
      expect(housing.text).to.equal('Housing, eviction and homelessness');
      expect(housing.selected).to.equal(false);

      // Expect debt category
      const debt = renderData.categoryItems.find((i: any) => i.value === 'debt');
      expect(debt).to.exist;
      expect(debt.text).to.equal('Debt, money problems and bankruptcy');
      expect(debt.selected).to.equal(false);

      // Expect "I don't know"
      const idk = renderData.categoryItems.find((i: any) => i.value === 'none');
      expect(idk).to.exist;
      expect(idk.text).to.equal("I don't know");
      expect(idk.selected).to.equal(false);

    });

    // INTERNAL TRUE (Multiple categories) → USE provider.law_category

    it('should use provider.law_category when internal not false', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'family', name: 'Family' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      await getAboutNewCaseForm(req, res, next);

      const [, viewModel] = res.render.firstCall.args;

      expect(viewModel.categoryItems).to.have.length(3); // placeholder + 2 items

      expect(viewModel.categoryItems[1]).to.deep.equal({
        value: 'family',
        text: 'Family',
        selected: false
      });
    });

    // INTERNAL TRUE (Single category) → USE provider.law_category

    it('should use provider.law_category when internal not false', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'family', name: 'Family' }
          ]
        }
      });

      await getAboutNewCaseForm(req, res, next);

      const [, viewModel] = res.render.firstCall.args;

      expect(viewModel.categoryItems).to.have.length(2); // placeholder + 1 items

      expect(viewModel.categoryItems[1]).to.deep.equal({
        value: 'family',
        text: 'Family',
        selected: false
      });
    });
  });

  describe('submitAboutNewCaseForm', () => {
    let req: any;
    let res: any;
    let next: sinon.SinonStub;

    beforeEach(() => {
      req = {
        params: { caseReference: 'TEST123' },
        axiosMiddleware: {},
        session: {},
        csrfToken: () => 'test-token',
        clientData: {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          providerId: '20'
        }
      };

      res = {
        render: sinon.stub(),
        redirect: sinon.stub(),
        status: sinon.stub().returnsThis()
      };

      next = sinon.stub();

      let getAllCategoriesStub = sinon.stub(apiService, 'getAllCategories');
    });

    afterEach(() => sinon.restore());

    // Category is selected but notes box is empty

    it('when a category is selected but notes are empty the page is displayed with the selected category', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      req.body = {
        category: 'housing',
        notes: '',
      };

 
      for (const validator of validateAboutNewCase()) {
        await runMiddleware([validator], req);
      }

      console.log(require('express-validator').validationResult(req).array());

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing, eviction and homelessness' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      await submitAboutNewCaseForm(req, res, next);

      expect(res.render.called).to.be.true;
      const [, renderData] = res.render.firstCall.args;


      expect(renderData.errorState.hasErrors).to.equal(true);
      expect(renderData.errorState.fieldErrors.notes.text).to.equal('Enter why you want to split this case');

      // Expect the placeholder exists
      const placeholder = renderData.categoryItems.find((i: any) => i.value === '');
      expect(placeholder).to.exist;
      expect(placeholder.text).to.be.a('string').and.not.empty;
      expect(placeholder.selected).to.equal(false);

      // Expect housing category
      const housing = renderData.categoryItems.find((i: any) => i.value === 'housing');
      expect(housing).to.exist;
      expect(housing.text).to.equal('Housing, eviction and homelessness');
      expect(housing.selected).to.equal(true);

      // Expect crime category
      const debt = renderData.categoryItems.find((i: any) => i.value === 'crime');
      expect(debt).to.exist;
      expect(debt.text).to.equal('Crime/Criminal Law');
      expect(debt.selected).to.equal(false);

      expect(renderData.categoryItems).to.have.length(3);

    });

    // Notes are added but there is no category selected.

    it('when no category is selected but notes are provided the page is displayed with the notes', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      req.body = {
        category: '',
        notes: 'Split required due to change of circumstances',
      };


      for (const validator of validateAboutNewCase()) {
        await runMiddleware([validator], req);
      }

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing, eviction and homelessness' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      await submitAboutNewCaseForm(req, res, next);

      expect(res.render.called).to.be.true;
      const [, renderData] = res.render.firstCall.args;

      expect(renderData.errorState.hasErrors).to.equal(true);
      expect(renderData.errorState.fieldErrors.category.text).to.equal('Select the category of law for the new case');

      // Expect the placeholder exists
      const placeholder = renderData.categoryItems.find((i: any) => i.value === '');
      expect(placeholder).to.exist;
      expect(placeholder.text).to.be.a('string').and.not.empty;
      expect(placeholder.selected).to.equal(true); // Selected as no choice was made by the user. 

      // Expect housing category
      const housing = renderData.categoryItems.find((i: any) => i.value === 'housing');
      expect(housing).to.exist;
      expect(housing.text).to.equal('Housing, eviction and homelessness');
      expect(housing.selected).to.equal(false);

      // Expect crime category
      const debt = renderData.categoryItems.find((i: any) => i.value === 'crime');
      expect(debt).to.exist;
      expect(debt.text).to.equal('Crime/Criminal Law');
      expect(debt.selected).to.equal(false);
      expect(renderData.categoryItems).to.have.length(3);

    });

    // When both category and notes are empty both are displayed as an error. 

    it('when both category and notes are empty both are displayed as an error', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      req.body = {
        category: '',
        notes: '',
      };


      const validators = validateAboutNewCase();
      await runMiddleware(validators, req);

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing, eviction and homelessness' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      await submitAboutNewCaseForm(req, res, next);

      expect(res.render.called).to.be.true;
      const [, renderData] = res.render.firstCall.args;

      expect(renderData.errorState.hasErrors).to.equal(true);
      expect(renderData.errorState.fieldErrors.category.text).to.equal('Select the category of law for the new case');
      expect(renderData.errorState.fieldErrors.notes.text).to.equal('Enter why you want to split this case');

      // Expect the placeholder exists
      const placeholder = renderData.categoryItems.find((i: any) => i.value === '');
      expect(placeholder).to.exist;
      expect(placeholder.text).to.be.a('string').and.not.empty;
      expect(placeholder.selected).to.equal(true);

      // Expect housing category
      const housing = renderData.categoryItems.find((i: any) => i.value === 'housing');
      expect(housing).to.exist;
      expect(housing.text).to.equal('Housing, eviction and homelessness');
      expect(housing.selected).to.equal(false);

      // Expect crime category
      const debt = renderData.categoryItems.find((i: any) => i.value === 'crime');
      expect(debt).to.exist;
      expect(debt.text).to.equal('Crime/Criminal Law');
      expect(debt.selected).to.equal(false);
      expect(renderData.categoryItems).to.have.length(3);

    });

    // When the notes length exceeds 2500 words an error is displayed. 

    it('When the notes length exceeds 2500 words an error is displayed', async () => {
      req.session.splitCaseCache = { internal: 'true' };
      const longComment = 'a'.repeat(2501); // Exceeds MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH
      req.body = {
        category: 'housing',
        notes: longComment,
      };
      const validators = validateAboutNewCase();
      await runMiddleware(validators, req);

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing, eviction and homelessness' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      await submitAboutNewCaseForm(req, res, next);

      expect(res.render.called).to.be.true;
      const [, renderData] = res.render.firstCall.args;

      expect(renderData.errorState.hasErrors).to.equal(true);
      expect(renderData.errorState.fieldErrors.notes.text).to.equal('Why you want to split this case must be 2500 characters or less');

      // Expect the placeholder exists
      const placeholder = renderData.categoryItems.find((i: any) => i.value === '');
      expect(placeholder).to.exist;
      expect(placeholder.text).to.be.a('string').and.not.empty;
      expect(placeholder.selected).to.equal(false);

      // Expect housing category
      const housing = renderData.categoryItems.find((i: any) => i.value === 'housing');
      expect(housing).to.exist;
      expect(housing.text).to.equal('Housing, eviction and homelessness');
      expect(housing.selected).to.equal(true);

      // Expect crime category
      const debt = renderData.categoryItems.find((i: any) => i.value === 'crime');
      expect(debt).to.exist;
      expect(debt.text).to.equal('Crime/Criminal Law');
      expect(debt.selected).to.equal(false);
      expect(renderData.categoryItems).to.have.length(3);

    });

    // When everything is correct the page is redirected. 

    it('When everything is correct the page is redirected', async () => {
      req.session.splitCaseCache = { internal: 'true' };

      req.body = {
        category: 'Housing, eviction and homelessness',
        notes: 'Splitting case due to change in circumstances.',
      };


      const validators = validateAboutNewCase();
      await runMiddleware(validators, req);

      getProviderChoicesStub.resolves({
        status: 'success',
        data: {
          id: '20',
          name: 'Provider X',
          law_category: [
            { code: 'housing', name: 'Housing, eviction and homelessness' },
            { code: 'crime', name: 'Crime/Criminal Law' }
          ]
        }
      });

      const redirectStub = sinon.stub();
      res.redirect = redirectStub;

      await submitAboutNewCaseForm(req, res, next);
      expect(res.redirect.calledWith('/cases/TEST123/check-split-case-answers')).to.be.true;
    });
  });
});