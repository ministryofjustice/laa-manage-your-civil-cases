/**
 * Operator Feedback Controller Tests
 * 
 * Tests the Express.js controllers for operator feedback functionality.
 * Covers HTTP request/response handling for feedback form including:
 * - GET route handler for form display with dynamic feedback choices
 * - POST route handler for form submission  
 * - API integration for feedback choices and submission
 * - CSRF token management
 * - Form data processing and validation integration
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Controllers
 * Dependencies: apiService, form validation helpers
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import {
  getOperatorFeedbackForm,
  submitOperatorFeedback
} from '#src/scripts/controllers/operatorFeedbackController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';
import { validateOperatorFeedback } from '#src/middlewares/operatorFeedbackSchema.js';
import { ValidationChain } from 'express-validator';

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

describe('Operator Feedback Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let getFeedbackChoicesStub: sinon.SinonStub;
  let submitFeedbackStub: sinon.SinonStub;
  let getClientDetailsStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
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

    // Stub the API service methods
    getFeedbackChoicesStub = sinon.stub(apiService, 'getFeedbackChoices');
    submitFeedbackStub = sinon.stub(apiService, 'submitOperatorFeedback');
    getClientDetailsStub = sinon.stub(apiService, 'getClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getOperatorFeedbackForm', () => {
    it('should render feedback form with dynamic choices from API and CSRF protection', async () => {
      // Arrange
      const mockFeedbackChoices = {
        status: 'success',
        data: [
          { display_name: 'Advisor conduct', value: 'ADCO' },
          { display_name: 'Access problems', value: 'ACPR' },
          { display_name: 'Other', value: 'OTHR' }
        ]
      };

      getFeedbackChoicesStub.resolves(mockFeedbackChoices);

      // Act
      await getOperatorFeedbackForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(getFeedbackChoicesStub.calledOnce).to.be.true;
      expect(getFeedbackChoicesStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(renderStub.calledWith('case_details/give-operator-feedback.njk')).to.be.true;

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.caseReference).to.equal('TEST123');
      expect(renderArgs.categoryItems).to.be.an('array');
      expect(renderArgs.categoryItems).to.have.lengthOf(4); // 1 default + 3 choices
      expect(renderArgs.categoryItems[0].value).to.equal('');
      expect(renderArgs.categoryItems[0].text).to.equal('Select a category');
      expect(renderArgs.categoryItems[1].value).to.equal('ADCO');
      expect(renderArgs.categoryItems[1].text).to.equal('Advisor conduct');
      expect(renderArgs.csrfToken).to.equal('test-csrf-token');
      expect(renderArgs.maxCommentLength).to.be.a('number');
      expect(renderArgs.characterThreshold).to.be.a('number');
    });

    it('should delegate API errors to Express error handling middleware when fetching feedback choices fails', async () => {
      // Arrange
      getFeedbackChoicesStub.resolves({
        status: 'error',
        data: null,
        message: 'API Error'
      });

      // Act
      await getOperatorFeedbackForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(getFeedbackChoicesStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      expect(renderStub.called).to.be.false;
    });

    it('should handle null data from feedback choices API', async () => {
      // Arrange
      getFeedbackChoicesStub.resolves({
        status: 'success',
        data: null
      });

      // Act
      await getOperatorFeedbackForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(renderStub.called).to.be.false;
    });

    it('should handle exceptions during form rendering', async () => {
      // Arrange
      const error = new Error('Rendering Error');
      getFeedbackChoicesStub.rejects(error);

      // Act
      await getOperatorFeedbackForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });

    it('should handle invalid case reference', async () => {
      // Arrange
      req.params = { caseReference: '' };

      // Act
      await getOperatorFeedbackForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(getFeedbackChoicesStub.called).to.be.false;
      // validCaseReference renders an error page when case reference is invalid
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
    });
  });

  describe('submitOperatorFeedback', () => {
    it('should process successful feedback submission and redirect to client details', async () => {
      // Arrange
      req.body = {
        category: 'ADCO',
        comment: 'Great service from the advisor'
      };

      submitFeedbackStub.resolves({
        status: 'success',
        data: {}
      });

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.calledOnce).to.be.true;
      expect(submitFeedbackStub.calledWith(
        req.axiosMiddleware,
        'TEST123',
        {
          issue: 'ADCO',
          comment: 'Great service from the advisor'
        }
      )).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors and re-render form with error messages', async () => {
      // Arrange
      req.body = {
        category: '',
        comment: ''
      };

      const mockFeedbackChoices = {
        status: 'success',
        data: [
          { display_name: 'Advisor conduct', value: 'ADCO' },
          { display_name: 'Other', value: 'OTHR' }
        ]
      };

      getFeedbackChoicesStub.resolves(mockFeedbackChoices);
      getClientDetailsStub.resolves({
        status: 'success',
        data: {
          fullName: 'John Doe',
          caseReference: 'TEST123'
        }
      });

      await runSchema(req as any, validateOperatorFeedback());

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('case_details/give-operator-feedback.njk')).to.be.true;

      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.errorState.hasErrors).to.be.true;
      expect(renderArgs.errorState.errors).to.be.an('array');
      expect(renderArgs.categoryItems).to.be.an('array');
    });

    it('should handle validation error when comment exceeds maximum length', async () => {
      // Arrange
      const longComment = 'a'.repeat(2501); // Exceeds MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH
      req.body = {
        category: 'ADCO',
        comment: longComment
      };

      const mockFeedbackChoices = {
        status: 'success',
        data: [
          { display_name: 'Advisor conduct', value: 'ADCO' }
        ]
      };

      getFeedbackChoicesStub.resolves(mockFeedbackChoices);
      getClientDetailsStub.resolves({
        status: 'success',
        data: { fullName: 'John Doe' }
      });

      await runSchema(req as any, validateOperatorFeedback());

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
    });

    it('should preserve selected category when validation fails', async () => {
      // Arrange
      req.body = {
        category: 'ADCO',
        comment: '' // Empty comment triggers validation error
      };

      const mockFeedbackChoices = {
        status: 'success',
        data: [
          { display_name: 'Advisor conduct', value: 'ADCO' },
          { display_name: 'Other', value: 'OTHR' }
        ]
      };

      getFeedbackChoicesStub.resolves(mockFeedbackChoices);
      getClientDetailsStub.resolves({
        status: 'success',
        data: { fullName: 'John Doe' }
      });

      await runSchema(req as any, validateOperatorFeedback());

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      const renderArgs = renderStub.firstCall.args[1];
      expect(renderArgs.formData.category).to.equal('ADCO');
      expect(renderArgs.categoryItems.find((item: any) => item.value === 'ADCO')?.selected).to.be.true;
    });

    it('should handle API error when submitting feedback', async () => {
      // Arrange
      req.body = {
        category: 'ADCO',
        comment: 'Test feedback'
      };

      submitFeedbackStub.resolves({
        status: 'error',
        data: null,
        message: 'Failed to submit feedback'
      });

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.calledOnce).to.be.true;
      expect(next.calledOnce).to.be.true;
      expect(redirectStub.called).to.be.false;
    });

    it('should handle error when fetching data for validation error rendering', async () => {
      // Arrange
      req.body = {
        category: '',
        comment: ''
      };

      getClientDetailsStub.resolves({
        status: 'error',
        data: null
      });

      await runSchema(req as any, validateOperatorFeedback());

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(renderStub.called).to.be.false;
    });

    it('should handle error when fetching feedback choices for validation error rendering', async () => {
      // Arrange
      req.body = {
        category: '',
        comment: ''
      };

      getClientDetailsStub.resolves({
        status: 'success',
        data: { fullName: 'John Doe' }
      });

      getFeedbackChoicesStub.resolves({
        status: 'error',
        data: null
      });

      await runSchema(req as any, validateOperatorFeedback());

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(renderStub.called).to.be.false;
    });

    it('should handle exceptions during submission', async () => {
      // Arrange
      req.body = {
        category: 'ADCO',
        comment: 'Test feedback'
      };

      const error = new Error('Submission Error');
      submitFeedbackStub.rejects(error);

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });

    it('should handle invalid case reference', async () => {
      // Arrange
      req.params = { caseReference: '' };
      req.body = {
        category: 'ADCO',
        comment: 'Test feedback'
      };

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.called).to.be.false;
      // validCaseReference renders an error page when case reference is invalid
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk')).to.be.true;
    });

    it('should trim whitespace from inputs before submission', async () => {
      // Arrange
      req.body = {
        category: '  ADCO  ',
        comment: '  Great service  '
      };

      // Simulate validation middleware trimming (validation schema has trim: true)
      req.body.category = req.body.category.trim();
      req.body.comment = req.body.comment.trim();

      // Act
      await submitOperatorFeedback(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(submitFeedbackStub.calledOnce).to.be.true;
      const submitArgs = submitFeedbackStub.firstCall.args[2];
      expect(submitArgs.issue).to.equal('ADCO');
      expect(submitArgs.comment).to.equal('Great service');
    });
  });
});
